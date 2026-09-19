import { describe, expect, it } from 'vitest';
import type { Budget, Transaction } from '@chashly/shared';
import { classify, evaluateBudgets, projectMonthEnd, summarizeMonth } from './budget-engine';

const REF = new Date(2026, 8, 15, 12); // 15 de septiembre 2026 (30 días)

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    type: 'expense',
    amount: 1000,
    currency: 'COP',
    category: 'Alimentación',
    description: '',
    occurredAt: new Date(2026, 8, 10, 12).toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
    ...partial,
  };
}

const budget = (category: string, monthlyLimit: number): Budget => ({
  id: crypto.randomUUID(),
  category,
  monthlyLimit,
  updatedAt: new Date().toISOString(),
  deleted: false,
});

describe('summarizeMonth', () => {
  it('suma ingresos y gastos del mes e ignora borrados y otros meses', () => {
    const summary = summarizeMonth(
      [
        tx({ type: 'income', amount: 5000, category: 'Salario' }),
        tx({ amount: 1200 }),
        tx({ amount: 999, deleted: true }),
        tx({ amount: 700, occurredAt: new Date(2026, 7, 30, 12).toISOString() }),
      ],
      REF,
    );
    expect(summary).toMatchObject({ income: 5000, expense: 1200, balance: 3800 });
    expect(summary.expenseByCategory.get('Alimentación')).toBe(1200);
  });
});

describe('projectMonthEnd', () => {
  it('proyecta linealmente el gasto al cierre del mes', () => {
    expect(projectMonthEnd(15_000, REF)).toBe(30_000);
  });
});

describe('classify', () => {
  it('detecta desviaciones', () => {
    expect(classify(500, 900, 1000)).toBe('ok');
    expect(classify(800, 900, 1000)).toBe('warning');
    expect(classify(500, 1200, 1000)).toBe('warning');
    expect(classify(1100, 1200, 1000)).toBe('exceeded');
  });
});

describe('evaluateBudgets', () => {
  it('ordena por porcentaje consumido y omite presupuestos borrados', () => {
    const summary = summarizeMonth([tx({ amount: 900 }), tx({ amount: 100, category: 'Transporte' })], REF);
    const result = evaluateBudgets(
      [budget('Transporte', 1000), budget('Alimentación', 1000), { ...budget('Salud', 1), deleted: true }],
      summary,
      REF,
    );
    expect(result.map((r) => r.budget.category)).toEqual(['Alimentación', 'Transporte']);
    expect(result[0]?.status).toBe('warning');
  });
});
