import type { Budget, Transaction } from '@chashly/shared';
import { daysInMonth, monthKey } from '../../lib/dates';

/**
 * Motor analítico de presupuestos (RF-03). Funciones puras: fáciles de probar y
 * reutilizables en el cliente o en el servidor.
 */

export const WARNING_RATIO = 0.8;

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  expenseByCategory: Map<string, number>;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface BudgetEvaluation {
  budget: Budget;
  spent: number;
  ratio: number;
  /** Gasto proyectado al cierre del mes con el ritmo actual. */
  projected: number;
  status: BudgetStatus;
}

export function summarizeMonth(transactions: Transaction[], reference: Date): MonthSummary {
  const key = monthKey(reference);
  const summary: MonthSummary = { income: 0, expense: 0, balance: 0, expenseByCategory: new Map() };

  for (const tx of transactions) {
    if (tx.deleted || monthKey(tx.occurredAt) !== key) continue;
    if (tx.type === 'income') {
      summary.income += tx.amount;
    } else {
      summary.expense += tx.amount;
      summary.expenseByCategory.set(tx.category, (summary.expenseByCategory.get(tx.category) ?? 0) + tx.amount);
    }
  }
  summary.balance = summary.income - summary.expense;
  return summary;
}

export function projectMonthEnd(spent: number, reference: Date): number {
  const elapsedDays = Math.max(reference.getDate(), 1);
  return Math.round((spent / elapsedDays) * daysInMonth(reference));
}

export function classify(spent: number, projected: number, limit: number): BudgetStatus {
  if (spent > limit) return 'exceeded';
  if (spent >= limit * WARNING_RATIO || projected > limit) return 'warning';
  return 'ok';
}

export function evaluateBudgets(
  budgets: Budget[],
  summary: MonthSummary,
  reference: Date,
): BudgetEvaluation[] {
  return budgets
    .filter((b) => !b.deleted)
    .map((budget) => {
      const spent = summary.expenseByCategory.get(budget.category) ?? 0;
      const projected = projectMonthEnd(spent, reference);
      return {
        budget,
        spent,
        ratio: spent / budget.monthlyLimit,
        projected,
        status: classify(spent, projected, budget.monthlyLimit),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
