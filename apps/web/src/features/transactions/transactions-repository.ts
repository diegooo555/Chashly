import { useLiveQuery } from 'dexie-react-hooks';
import type { Transaction, TransactionType } from '@chashly/shared';
import { deleteLocal, saveLocal } from '../../data/local-store';
import { db } from '../../db/database';
import { DEFAULT_CURRENCY } from '../../lib/money';
import { notifyIfBudgetCrossed, spentThisMonth } from '../budgets/budget-alerts';

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  occurredAt: string;
}

export function useTransactions(limit?: number): Transaction[] | undefined {
  return useLiveQuery(async () => {
    const collection = db.transactions.orderBy('occurredAt').reverse().filter((t) => !t.deleted);
    return limit ? collection.limit(limit).toArray() : collection.toArray();
  }, [limit]);
}

/** IDs con cambios aún no enviados a la nube (para marcarlos en la UI). */
export function usePendingIds(): Set<string> {
  const ids = useLiveQuery(() => db.outbox.toArray((rows) => rows.map((r) => r.entityId)), [], []);
  return new Set(ids);
}

export async function addTransaction(input: NewTransaction): Promise<void> {
  const spentBefore = input.type === 'expense' ? await spentThisMonth(input.category) : 0;
  await saveLocal('transaction', {
    ...input,
    id: crypto.randomUUID(),
    currency: DEFAULT_CURRENCY,
    description: input.description.trim(),
    updatedAt: '',
    deleted: false,
  });
  if (input.type === 'expense') await notifyIfBudgetCrossed(input.category, spentBefore);
}

export const removeTransaction = (id: string) => deleteLocal('transaction', id);
