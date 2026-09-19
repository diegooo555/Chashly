import { useState, type FormEvent } from 'react';
import { CATEGORIES } from '@chashly/shared';
import { toMinorUnits } from '../../lib/money';
import { BudgetMeter } from './BudgetMeter';
import { removeBudget, setBudget } from './budgets-repository';
import { useMonthAnalysis } from './use-month-analysis';

const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== 'Salario');

function NotificationsToggle() {
  const supported = 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied');
  if (!supported || permission === 'granted') return null;

  return (
    <div className="notice">
      <p>
        {permission === 'denied'
          ? 'Las alertas están bloqueadas. Actívalas desde la configuración del navegador.'
          : 'Recibe un aviso cuando superes un presupuesto.'}
      </p>
      {permission === 'default' && (
        <button
          type="button"
          className="button button--ghost"
          onClick={async () => setPermission(await Notification.requestPermission())}
        >
          Activar alertas
        </button>
      )}
    </div>
  );
}

export function BudgetsPage() {
  const analysis = useMonthAnalysis();
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0] ?? 'Otros');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const minor = toMinorUnits(limit);
    if (minor === null) {
      setError('Escribe un límite mayor que cero.');
      return;
    }
    await setBudget(category, minor);
    setLimit('');
    setError(null);
  }

  if (!analysis) return null;

  return (
    <div className="page">
      <h1 className="page__title">Presupuestos del mes</h1>
      <NotificationsToggle />

      {analysis.evaluations.length === 0 ? (
        <p className="empty">Define un límite mensual por categoría y te avisaremos si te acercas.</p>
      ) : (
        <ul className="meters">
          {analysis.evaluations.map((evaluation) => (
            <li key={evaluation.budget.id} className="meters__item">
              <BudgetMeter evaluation={evaluation} />
              <button
                type="button"
                className="link-button"
                onClick={() => void removeBudget(evaluation.budget.id)}
              >
                Quitar límite
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="form form--inline" onSubmit={handleSubmit} noValidate>
        <h2 className="section-title">Definir límite</h2>
        <label className="field">
          <span className="field__label">Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Límite mensual en pesos</span>
          <input
            inputMode="decimal"
            placeholder="500000"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && <span className="field__error">{error}</span>}
        </label>
        <button type="submit" className="button button--primary">
          Guardar límite
        </button>
      </form>
    </div>
  );
}
