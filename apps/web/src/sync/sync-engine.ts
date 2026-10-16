import type { Change, PullResponse, PushResponse, RemoteRecord } from '@chashly/shared';
import { db } from '../db/database';
import { deleteMeta, getMeta, setMeta } from '../db/meta';
import { ApiError, apiRequest } from '../lib/api-client';
import { PULL_PAGE_SIZE, PUSH_BATCH_SIZE, SYNC_LOCK, type SyncResult } from './constants';









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





async function applyRemote({ entity, data }: RemoteRecord): Promise<void> {
  const pending = await db.outbox.where('[entity+entityId]').equals([entity, data.id]).count();
  if (pending > 0) return;
  
  await db.tableFor(entity).put(data as never);
}
