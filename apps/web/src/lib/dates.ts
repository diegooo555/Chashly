export const nowIso = () => new Date().toISOString();

export function monthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Valor para <input type="date"> en hora local. */
export function toDateInputValue(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Convierte "2026-09-18" a ISO al mediodía local (evita saltos de día por zona horaria). */
export function fromDateInputValue(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12).toISOString();
}

const dayFormatter = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' });

export const formatDay = (iso: string) => dayFormatter.format(new Date(iso));
export const formatTime = (ms: number) => timeFormatter.format(new Date(ms));
