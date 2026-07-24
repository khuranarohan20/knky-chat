/** Currency + duration formatters shared across bubbles. */

export function formatCurrency(n?: number | string): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v);
}

/** Compact currency, e.g. "$2k", "$1.5M" (matches the agency formatter). */
export function formatCompactCurrency(n?: number, currency = 'USD', digits = 1): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return 'Error';
  const out = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n);
  return out.replace('K', 'k');
}

export function formatDuration(sec?: number): string {
  const s = Math.max(0, Math.floor(Number(sec ?? 0)));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
