import type { Change, PullResponse, PushResponse, RemoteRecord } from '@chashly/shared';
import { db } from '../db/database';
import { deleteMeta, getMeta, setMeta } from '../db/meta';
import { ApiError, apiRequest } from '../lib/api-client';
import { PULL_PAGE_SIZE, PUSH_BATCH_SIZE, SYNC_LOCK, type SyncResult } from './constants';

/**
 * Motor de sincronización. Se ejecuta en DOS contextos con el mismo código:
 *  - en el service worker, cuando el navegador dispara el evento `sync` (Background Sync);
 *  - en la ventana, como respaldo en navegadores sin Background Sync (Safari, Firefox).
 *
 * Un Web Lock evita que ambos contextos sincronicen a la vez.
 * Si falla por red, lanza el error: en el SW eso le indica al navegador que reintente más tarde.
 */
export async function runSync(): Promise<SyncResult> {
  return withExclusiveLock(async () => {
    const session = await getMeta('session');
    if (!session) return { pushed: 0, pulled: 0 };

    try {
      const pushed = await pushOutbox(session.token);
      const pulled = await pullChanges(session.token);
      await setMeta('lastSyncedAt', Date.now());
      await setMeta('lastSyncError', null);
      return { pushed, pulled };
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        // Token vencido: se cierra la sesión pero se CONSERVA el outbox para enviarlo al volver a entrar.
        await deleteMeta('session');
      }
      await setMeta('lastSyncError', error instanceof Error ? error.message : String(error));
      throw error;
    }
  });
}

async function withExclusiveLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  if (!locks) return task();
  return locks.request(SYNC_LOCK, task) as Promise<T>;
}

async function pushOutbox(token: string): Promise<number> {
  let pushed = 0;

  for (;;) {
    const batch = await db.outbox.orderBy('createdAt').limit(PUSH_BATCH_SIZE).toArray();
    if (batch.length === 0) return pushed;

    const changes: Change[] = batch.map(({ opId, entity, data }) => ({ opId, entity, data }));
    const { results } = await apiRequest<PushResponse>('/api/sync/push', {
      method: 'POST',
      body: { changes },
      token,
    });

    await db.transaction('rw', db.outbox, db.transactions, db.budgets, async () => {
      for (const result of results) {
        await db.outbox.delete(result.opId);
        if (result.status === 'stale' && result.current) {
          await applyRemote(result.current);
        }
      }
    });
    pushed += results.length;
  }
}

async function pullChanges(token: string): Promise<number> {
  let cursor = (await getMeta('pullCursor')) ?? 0;
  let pulled = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await apiRequest<PullResponse>(
      `/api/sync/pull?since=${cursor}&limit=${PULL_PAGE_SIZE}`,
      { token },
    );

    await db.transaction('rw', db.outbox, db.transactions, db.budgets, db.meta, async () => {
      for (const record of page.records) await applyRemote(record);
      await setMeta('pullCursor', page.cursor);
    });

    pulled += page.records.length;
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return pulled;
}

/**
 * Aplica un registro remoto salvo que haya un cambio local pendiente para ese registro:
 * en ese caso gana el local hasta que se envíe y el servidor decida (last-write-wins).
 */
async function applyRemote({ entity, data }: RemoteRecord): Promise<void> {
  const pending = await db.outbox.where('[entity+entityId]').equals([entity, data.id]).count();
  if (pending > 0) return;
  // El servidor ya validó con el esquema compartido; aquí confiamos en el contrato.
  await db.tableFor(entity).put(data as never);
}
