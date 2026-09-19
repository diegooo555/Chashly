import { Link } from 'react-router-dom';
import { Money } from '../../components/Money';
import { formatMoney } from '../../lib/money';
import { BudgetMeter } from '../budgets/BudgetMeter';
import { useMonthAnalysis } from '../budgets/use-month-analysis';
import { TransactionList } from '../transactions/TransactionList';
import { useTransactions } from '../transactions/transactions-repository';

const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date());

export function DashboardPage() {
  const analysis = useMonthAnalysis();
  const recent = useTransactions(5);
  if (!analysis || !recent) return null;

  const { summary, evaluations } = analysis;
  const alerts = evaluations.filter((e) => e.status !== 'ok');

  return (
    <div className="page">
      <section className="balance" aria-labelledby="balance-label">
        <p id="balance-label" className="balance__label">
          Te queda en {monthName}
        </p>
        <p className={`balance__amount ${summary.balance < 0 ? 'balance__amount--negative' : ''}`}>
          {formatMoney(summary.balance)}
        </p>
        <dl className="balance__split">
          <div>
            <dt>Ingresos</dt>
            <dd>
              <Money amount={summary.income} type="income" />
            </dd>
          </div>
          <div>
            <dt>Gastos</dt>
            <dd>
              <Money amount={summary.expense} type="expense" />
            </dd>
          </div>
        </dl>
      </section>

      {alerts.length > 0 && (
        <section>
          <h2 className="section-title">Requiere atención</h2>
          <ul className="meters">
            {alerts.map((evaluation) => (
              <li key={evaluation.budget.id} className="meters__item">
                <BudgetMeter evaluation={evaluation} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2 className="section-title">Últimos movimientos</h2>
          {recent.length > 0 && <Link to="/movimientos">Ver todos</Link>}
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            <p>Registra tu primer gasto o ingreso para ver cómo va tu mes.</p>
            <Link to="/nuevo" className="button button--primary">
              Registrar movimiento
            </Link>
          </div>
        ) : (
          <TransactionList transactions={recent} />
        )}
      </section>
    </div>
  );
}
