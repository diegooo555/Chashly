import Dexie, { type Table } from 'dexie';
import type { Budget, EntityName, EntityOf, Transaction } from '@chashly/shared';

/** Cambio local pendiente de enviar al servidor (patrón Outbox). */
export interface OutboxEntry<E extends EntityName = EntityName> {
  opId: string;
  entity: E;
  entityId: string;
  data: EntityOf<E>;
  createdAt: number;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

/**
 * IndexedDB es la fuente de verdad en el dispositivo: la UI lee y escribe siempre aquí,
 * con o sin red. La sincronización con la nube ocurre en segundo plano.
 * La misma base es accesible desde la ventana y desde el service worker.
 */
export class ChashlyDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  outbox!: Table<OutboxEntry, string>;
  meta!: Table<MetaEntry, string>;

  constructor(name = 'chashly') {
    super(name);
    this.version(1).stores({
      transactions: 'id, occurredAt, category, type, deleted',
      budgets: 'id, category, deleted',
      outbox: 'opId, [entity+entityId], createdAt',
      meta: 'key',
    });
  }

  tableFor<E extends EntityName>(entity: E): Table<EntityOf<E>, string> {
    const tables: { [K in EntityName]: Table<EntityOf<K>, string> } = {
      transaction: this.transactions,
      budget: this.budgets,
    };
    return tables[entity] as Table<EntityOf<E>, string>;
  }
}

export const db = new ChashlyDatabase();
