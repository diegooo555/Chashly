export const DEFAULT_CURRENCY = 'COP';

/** Montos se guardan en centavos (enteros). Estas funciones son el único punto de conversión. */
export function toMinorUnits(value: string): number | null {
  const normalized = value.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(minor: number, currency = DEFAULT_CURRENCY): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(minor / 100);
}
