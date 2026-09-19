import type { EntityName, EntityOf } from '@chashly/shared';
import { db, type OutboxEntry } from '../db/database';
import { nowIso } from '../lib/dates';
import { requestSync } from '../sync/scheduler';

/**
 * Escritura local-first con patrón Outbox:
 * en UNA transacción de IndexedDB se guarda el registro y se encola el cambio.
 * Si la app se cierra justo después, el cambio no se pierde: se enviará en el próximo sync.
 *
 * Además compacta la cola: si ya había un cambio pendiente para el mismo registro, se
 * reemplaza, porque solo importa el estado más reciente.
 */
export async function saveLocal<E extends EntityName>(entity: E, record: EntityOf<E>): Promise<EntityOf<E>> {
  const stamped = { ...record, updatedAt: nowIso() } as EntityOf<E>;
  const table = db.tableFor(entity);

  await db.transaction('rw', table, db.outbox, async () => {
    await table.put(stamped);
    await db.outbox.where('[entity+entityId]').equals([entity, stamped.id]).delete();
    const entry: OutboxEntry<E> = {
      opId: crypto.randomUUID(),
      entity,
      entityId: stamped.id,
      data: stamped,
      createdAt: Date.now(),
    };
    await db.outbox.add(entry as OutboxEntry);
  });

  void requestSync();
  return stamped;
}

/** Borrado lógico (tombstone) para que el borrado también viaje a la nube. */
export async function deleteLocal<E extends EntityName>(entity: E, id: string): Promise<void> {
  const existing = await db.tableFor(entity).get(id);
  if (!existing) return;
  await saveLocal(entity, { ...existing, deleted: true });
}
