import type { TransactionType } from '@chashly/shared';
import { formatMoney } from '../lib/money';

interface MoneyProps {
  amount: number;
  type?: TransactionType;
  className?: string;
}

export function Money({ amount, type, className = '' }: MoneyProps) {
  const sign = type === 'income' ? '+' : type === 'expense' ? '−' : '';
  return (
    <span className={`money ${type ? `money--${type}` : ''} ${className}`.trim()}>
      {sign}
      {formatMoney(amount)}
    </span>
  );
}
