// Local-calendar date helpers. Dates are stored as 'YYYY-MM-DD' strings so
// they never shift with time zones or daylight saving.

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Whole days from a to b (b - a). DST-safe. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Monday of the week containing iso. */
export function mondayOf(iso: string): string {
  const day = parseISO(iso).getDay(); // 0 = Sun
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function formatDay(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatShortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
