import { useLiveQuery } from 'dexie-react-hooks';
import type { Budget } from '@chashly/shared';
import { deleteLocal, saveLocal } from '../../data/local-store';
import { db } from '../../db/database';

export function useBudgets(): Budget[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.budgets.filter((b) => !b.deleted).toArray();
    // Si dos dispositivos crearon offline un presupuesto para la misma categoría, gana el más reciente.
    const latest = new Map<string, Budget>();
    for (const b of all) {
      const current = latest.get(b.category);
      if (!current || current.updatedAt < b.updatedAt) latest.set(b.category, b);
    }
    return [...latest.values()].sort((a, b) => a.category.localeCompare(b.category));
  });
}

export async function setBudget(category: string, monthlyLimit: number): Promise<void> {
  const existing = await db.budgets.where('category').equals(category).first();
  await saveLocal('budget', {
    id: existing?.id ?? crypto.randomUUID(),
    category,
    monthlyLimit,
    updatedAt: '',
    deleted: false,
  });
}

export const removeBudget = (id: string) => deleteLocal('budget', id);
