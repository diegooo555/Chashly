import { formatMoney } from '../../lib/money';
import type { BudgetEvaluation } from './budget-engine';

const STATUS_TEXT = {
  ok: 'Vas bien',
  warning: 'Cerca del límite',
  exceeded: 'Límite superado',
} as const;

export function BudgetMeter({ evaluation }: { evaluation: BudgetEvaluation }) {
  const { budget, spent, ratio, projected, status } = evaluation;
  const percent = Math.round(ratio * 100);

  return (
    <div className={`meter meter--${status}`}>
      <div className="meter__head">
        <span className="meter__category">{budget.category}</span>
        <span className="meter__status">{STATUS_TEXT[status]}</span>
      </div>
      <div
        className="meter__track"
        role="progressbar"
        aria-label={`${budget.category}: ${percent}% del presupuesto`}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="meter__fill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <p className="meter__detail">
        {formatMoney(spent)} de {formatMoney(budget.monthlyLimit)}
        {status !== 'exceeded' && projected > budget.monthlyLimit && (
          <>. A este ritmo cerrarás el mes en {formatMoney(projected)}.</>
        )}
      </p>
    </div>
  );
}
