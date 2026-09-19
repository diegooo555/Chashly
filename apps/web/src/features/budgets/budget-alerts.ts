import { db } from '../../db/database';
import { formatMoney } from '../../lib/money';
import { evaluateBudgets, summarizeMonth } from './budget-engine';

/**
 * RF-05: alerta local cuando un gasto hace que una categoría supere su presupuesto.
 * Se evalúa en el dispositivo, por eso funciona también sin conexión.
 */
export async function notifyIfBudgetCrossed(category: string, before: number): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const [transactions, budgets] = await Promise.all([db.transactions.toArray(), db.budgets.toArray()]);
  const evaluation = evaluateBudgets(budgets, summarizeMonth(transactions, now), now).find(
    (e) => e.budget.category === category,
  );
  if (!evaluation || before > evaluation.budget.monthlyLimit || evaluation.status !== 'exceeded') return;

  const registration = await navigator.serviceWorker?.getRegistration();
  const body = `Llevas ${formatMoney(evaluation.spent)} de ${formatMoney(evaluation.budget.monthlyLimit)} este mes.`;
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', tag: `budget-${category}` };
  if (registration) await registration.showNotification(`Superaste el presupuesto de ${category}`, options);
  else new Notification(`Superaste el presupuesto de ${category}`, options);
}

export async function spentThisMonth(category: string): Promise<number> {
  const now = new Date();
  const transactions = await db.transactions.toArray();
  return summarizeMonth(transactions, now).expenseByCategory.get(category) ?? 0;
}
