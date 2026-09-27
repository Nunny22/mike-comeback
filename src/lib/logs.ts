// Helpers for describing logged activities.

import type { ActivityKind, WorkoutLog } from '../data/types.ts';
import { formatDuration, formatKm, formatPace, formatSpeed } from './format.ts';

export const kindLabel: Record<ActivityKind, string> = {
  run: 'Run',
  weights: 'Weights',
  bike: 'Bike',
  hike: 'Hike',
  walk: 'Walk',
  other: 'Other',
};

/** Runs and walks show pace; bikes and hikes show speed. */
export function paceOrSpeed(kind: ActivityKind, durationMin?: number, distanceKm?: number): string | undefined {
  if (kind === 'run' || kind === 'walk') return formatPace(durationMin, distanceKm);
  if (kind === 'bike' || kind === 'hike') return formatSpeed(durationMin, distanceKm);
  return undefined;
}

export const hasDistance = (kind: ActivityKind) => kind !== 'weights' && kind !== 'other';

/** "32 min · 4.8 km · 6:40 /km" */
export function logSummary(log: WorkoutLog): string {
  const parts: string[] = [];
  if (log.durationMin) parts.push(formatDuration(log.durationMin));
  if (log.distanceKm) parts.push(formatKm(log.distanceKm));
  const ps = paceOrSpeed(log.kind, log.durationMin, log.distanceKm);
  if (ps) parts.push(ps);
  if (log.kind === 'weights' && log.exercises?.length) {
    parts.push(`${log.exercises.filter((e) => e.weightKg || e.sets).length} exercises`);
  }
  if (log.rpe) parts.push(`RPE ${log.rpe}`);
  return parts.join(' · ');
}
