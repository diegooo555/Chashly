import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Change, Transaction } from '@chashly/shared';
// Prueba de integración: el motor del cliente habla con el SyncService real del servidor.
import { createInMemoryRepositories } from '../../../api/src/repositories/memory/index';
import { SyncService } from '../../../api/src/services/sync.service';
import { saveLocal } from '../data/local-store';
import { db } from '../db/database';
import { setMeta } from '../db/meta';
import { runSync } from './sync-engine';

const USER = 'user-1';
let server: SyncService;

function installFakeNetwork() {
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost');
    const body =
      url.pathname === '/api/sync/push'
        ? { results: await server.push(USER, (JSON.parse(String(init?.body)) as { changes: Change[] }).changes) }
        : await server.pull(USER, Number(url.searchParams.get('since')), Number(url.searchParams.get('limit')));
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

const baseTx = (): Transaction => ({
  id: crypto.randomUUID(),
  type: 'expense',
  amount: 12_000_00,
  currency: 'COP',
  category: 'Transporte',
  description: 'Bus',
  occurredAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deleted: false,
});

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  server = new SyncService(createInMemoryRepositories());
  await setMeta('session', { token: 'test', user: { id: USER, email: 'a@b.co' } });
  installFakeNetwork();
});

describe('sync engine', () => {
  it('sube los cambios hechos sin conexión y vacía el outbox', async () => {
    await saveLocal('transaction', baseTx());
    expect(await db.outbox.count()).toBe(1);

    const result = await runSync();

    expect(result.pushed).toBe(1);
    expect(await db.outbox.count()).toBe(0);
    expect((await server.pull(USER, 0, 10)).records).toHaveLength(1);
  });

  it('compacta varias ediciones del mismo registro en un solo cambio', async () => {
    const tx = await saveLocal('transaction', baseTx());
    await saveLocal('transaction', { ...tx, amount: 1 });
    await saveLocal('transaction', { ...tx, amount: 2 });

    expect(await db.outbox.count()).toBe(1);
  });

  it('descarga cambios hechos en otro dispositivo', async () => {
    const remote = baseTx();
    await server.push(USER, [{ opId: crypto.randomUUID(), entity: 'transaction', data: remote }]);

    const result = await runSync();

    expect(result.pulled).toBe(1);
    expect(await db.transactions.get(remote.id)).toMatchObject({ description: 'Bus' });
  });

  it('converge a la versión del servidor cuando la local es más antigua', async () => {
    const tx = await saveLocal('transaction', baseTx());
    const newer = { ...tx, amount: 99_00, updatedAt: new Date(Date.now() + 60_000).toISOString() };
    await server.push(USER, [{ opId: crypto.randomUUID(), entity: 'transaction', data: newer }]);

    await runSync();

    expect((await db.transactions.get(tx.id))?.amount).toBe(99_00);
  });

  it('conserva el outbox si la red falla, para reintentar después', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    await saveLocal('transaction', baseTx());

    await expect(runSync()).rejects.toThrow();
    expect(await db.outbox.count()).toBe(1);
  });
});
