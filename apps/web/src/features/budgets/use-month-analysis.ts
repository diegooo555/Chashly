import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { evaluateBudgets, summarizeMonth, type BudgetEvaluation, type MonthSummary } from './budget-engine';

export interface MonthAnalysis {
  summary: MonthSummary;
  evaluations: BudgetEvaluation[];
}

/** Resumen del mes en curso, recalculado automáticamente cuando cambian los datos locales. */
export function useMonthAnalysis(): MonthAnalysis | undefined {
  return useLiveQuery(async () => {
    const now = new Date();
    const [transactions, budgets] = await Promise.all([db.transactions.toArray(), db.budgets.toArray()]);
    const summary = summarizeMonth(transactions, now);
    return { summary, evaluations: evaluateBudgets(budgets, summary, now) };
  });
}
