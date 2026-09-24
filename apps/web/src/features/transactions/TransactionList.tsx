import type { Transaction } from '@chashly/shared';
import { Money } from '../../components/Money';
import { formatDay } from '../../lib/dates';
import { useTransactionPhotoUrl } from './transaction-photos';
import { removeTransaction, usePendingIds } from './transactions-repository';

function TransactionPhotoThumbnail({ transactionId }: { transactionId: string }) {
  const url = useTransactionPhotoUrl(transactionId);
  if (!url) return <span className="tx__photo tx__photo--empty" aria-hidden="true" />;
  return <img src={url} alt="" className="tx__photo" />;
}

interface Props {
  transactions: Transaction[];
  groupByDay?: boolean;
  allowDelete?: boolean;
}

function groupByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const day = formatDay(tx.occurredAt);
    groups.set(day, [...(groups.get(day) ?? []), tx]);
  }
  return [...groups.entries()];
}

export function TransactionList({ transactions, groupByDay = false, allowDelete = false }: Props) {
  const pending = usePendingIds();
  const groups = groupByDay ? groupByDate(transactions) : [['', transactions] as const];

  return (
    <div className="tx-groups">
      {groups.map(([day, items]) => (
        <section key={day || 'all'} className="tx-group">
          {day && <h3 className="tx-group__day">{day}</h3>}
          <ul className="tx-list">
            {items.map((tx) => (
              <li key={tx.id} className="tx">
                <TransactionPhotoThumbnail transactionId={tx.id} />
                <div className="tx__main">
                  <span className="tx__category">{tx.category}</span>
                  {tx.description && <span className="tx__description">{tx.description}</span>}
                </div>
                <div className="tx__side">
                  <Money amount={tx.amount} type={tx.type} />
                  {pending.has(tx.id) && <span className="tx__pending">Por subir</span>}
                </div>
                {allowDelete && (
                  <button
                    type="button"
                    className="tx__delete"
                    aria-label={`Eliminar ${tx.category} ${tx.description}`}
                    onClick={() => {
                      if (window.confirm('¿Eliminar este movimiento?')) void removeTransaction(tx.id);
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
