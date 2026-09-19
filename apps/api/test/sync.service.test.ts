import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Change } from '@chashly/shared';
import { createInMemoryRepositories } from '../src/repositories/memory/index.js';
import { SyncService } from '../src/services/sync.service.js';

const USER = 'user-1';

function txChange(overrides: Partial<Record<string, unknown>> = {}, id = randomUUID()): Change {
  return {
    opId: randomUUID(),
    entity: 'transaction',
    data: {
      id,
      type: 'expense',
      amount: 25_000_00,
      currency: 'COP',
      category: 'Alimentación',
      description: 'Mercado',
      occurredAt: '2026-09-10T12:00:00.000Z',
      updatedAt: '2026-09-10T12:00:00.000Z',
      deleted: false,
      ...overrides,
    },
  };
}

describe('SyncService', () => {
  it('aplica un cambio nuevo y lo devuelve en el pull', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    const change = txChange();

    const [result] = await sync.push(USER, [change]);
    const pull = await sync.pull(USER, 0, 50);

    expect(result?.status).toBe('applied');
    expect(pull.records).toHaveLength(1);
    expect(pull.cursor).toBe(1);
  });

  it('es idempotente: reenviar el mismo opId no duplica', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    const change = txChange();

    await sync.push(USER, [change]);
    const [retry] = await sync.push(USER, [change]);

    expect(retry?.status).toBe('duplicate');
    expect((await sync.pull(USER, 0, 50)).records).toHaveLength(1);
  });

  it('resuelve conflictos con last-write-wins y devuelve la versión ganadora', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    const id = randomUUID();
    await sync.push(USER, [txChange({ updatedAt: '2026-09-10T15:00:00.000Z', amount: 900 }, id)]);

    const [older] = await sync.push(USER, [
      txChange({ updatedAt: '2026-09-10T14:00:00.000Z', amount: 100 }, id),
    ]);

    expect(older?.status).toBe('stale');
    expect(older?.current?.data.amount).toBe(900);
  });

  it('aísla los datos entre usuarios', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    await sync.push(USER, [txChange()]);

    expect((await sync.pull('otro-usuario', 0, 50)).records).toHaveLength(0);
  });

  it('pagina el pull con cursor', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    await sync.push(USER, [txChange(), txChange(), txChange()]);

    const first = await sync.pull(USER, 0, 2);
    const second = await sync.pull(USER, first.cursor, 2);

    expect(first.hasMore).toBe(true);
    expect(second.records).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });

  it('rechaza datos que no cumplen el esquema de la entidad', async () => {
    const sync = new SyncService(createInMemoryRepositories());
    await expect(sync.push(USER, [txChange({ amount: -5 })])).rejects.toThrow();
  });
});
