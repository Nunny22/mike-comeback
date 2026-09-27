// Number/duration/pace formatting and parsing.

/** Parse "45", "45:30" or "1:05:00" into minutes. Returns undefined if blank/invalid. */
export function parseDuration(input: string): number | undefined {
  const s = input.trim();
  if (!s) return undefined;
  const parts = s.split(':').map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) return undefined;
  let min: number;
  if (parts.length === 1) min = parts[0];
  else if (parts.length === 2) min = parts[0] + parts[1] / 60;
  else if (parts.length === 3) min = parts[0] * 60 + parts[1] + parts[2] / 60;
  else return undefined;
  return min > 0 ? min : undefined;
}

/** Minutes → "45:30" or "1:05:00" (inverse of parseDuration). */
export function formatClock(min: number): string {
  const total = Math.round(min * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Minutes → "45 min" or "1 h 05". */
export function formatDuration(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

/** Pace in min/km as "6:12 /km". */
export function formatPace(durationMin?: number, distanceKm?: number): string | undefined {
  if (!durationMin || !distanceKm) return undefined;
  return `${formatClock(durationMin / distanceKm)} /km`;
}

export function speedKmh(durationMin?: number, distanceKm?: number): number | undefined {
  if (!durationMin || !distanceKm) return undefined;
  return distanceKm / (durationMin / 60);
}

export function formatSpeed(durationMin?: number, distanceKm?: number): string | undefined {
  const v = speedKmh(durationMin, distanceKm);
  return v === undefined ? undefined : `${v.toFixed(1)} km/h`;
}

export function formatKm(km: number): string {
  return `${Number(km.toFixed(2))} km`;
}

/** Parse an optional number field. Blank → undefined. */
export function num(input: string): number | undefined {
  const s = input.trim().replace(',', '.');
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
