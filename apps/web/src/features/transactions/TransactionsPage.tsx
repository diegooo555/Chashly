import { Link } from 'react-router-dom';
import { TransactionList } from './TransactionList';
import { useTransactions } from './transactions-repository';

export function TransactionsPage() {
  const transactions = useTransactions();
  if (!transactions) return null;

  return (
    <div className="page">
      <h1 className="page__title">Movimientos</h1>
      {transactions.length === 0 ? (
        <div className="empty">
          <p>Aún no has registrado movimientos.</p>
          <Link to="/nuevo" className="button button--primary">
            Registrar el primero
          </Link>
        </div>
      ) : (
        <TransactionList transactions={transactions} groupByDay allowDelete />
      )}
    </div>
  );
}
