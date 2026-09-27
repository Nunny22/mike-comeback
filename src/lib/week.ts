// Programme-week logic: which week it is, which sessions are done,
// what to do next, and how to describe a workout in one line.

import { programme } from '../data/programme.ts';
import type { AppState, RunItem, RunWorkout, SlotId, Workout, WorkoutLog } from '../data/types.ts';
import { addDays, daysBetween } from './dates.ts';
import { formatDuration } from './format.ts';

export const weekCount = () => programme.weeks.length;
export const slotIds = (): SlotId[] => programme.slots.map((s) => s.id);
export const slotDef = (id: SlotId) => programme.slots.find((s) => s.id === id)!;

/** Raw programme week for a date: may be < 1 (not started) or > weekCount (finished). */
export function rawWeekFor(startDate: string, date: string): number {
  return Math.floor(daysBetween(startDate, date) / 7) + 1;
}

/** Programme week to show, clamped to the programme's range. */
export function currentWeek(startDate: string, today: string): number {
  return Math.min(Math.max(rawWeekFor(startDate, today), 1), weekCount());
}

export function weekDates(startDate: string, week: number): { from: string; to: string } {
  const from = addDays(startDate, (week - 1) * 7);
  return { from, to: addDays(from, 6) };
}

/** The workout for a week/slot — the in-app edit if there is one, otherwise the plan. */
export function getWorkout(state: AppState, week: number, slot: SlotId): Workout {
  return state.overrides[week]?.[slot] ?? programme.weeks[week - 1].sessions[slot];
}

export function isEdited(state: AppState, week: number, slot: SlotId): boolean {
  return Boolean(state.overrides[week]?.[slot]);
}

export function slotLog(logs: WorkoutLog[], week: number, slot: SlotId): WorkoutLog | undefined {
  return logs.find((l) => l.slot === slot && l.week === week);
}

/** Bonus activities whose date falls in the given programme week. */
export function bonusLogs(state: AppState, week: number): WorkoutLog[] {
  const { from, to } = weekDates(state.settings.startDate, week);
  return state.logs
    .filter((l) => l.slot === null && l.date >= from && l.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface WeekSummary {
  week: number;
  done: SlotId[];
  count: number;
  target: number;
  next: SlotId | null;
  complete: boolean;
}

export function weekSummary(state: AppState, week: number): WeekSummary {
  const done = slotIds().filter((s) => slotLog(state.logs, week, s));
  const next = slotIds().find((s) => !done.includes(s)) ?? null;
  return { week, done, count: done.length, target: programme.target, next, complete: done.length >= programme.target };
}

// ---------- Describing workouts ----------

const isRepeat = (i: RunItem): i is Extract<RunItem, { repeat: number }> => 'repeat' in i;

/** Total planned minutes of a run, or undefined if it includes a distance step. */
export function runMinutes(w: RunWorkout): number | undefined {
  let total = 0;
  for (const item of w.items) {
    const steps = isRepeat(item) ? item.steps : [item];
    const times = isRepeat(item) ? item.repeat : 1;
    for (const s of steps) {
      if (s.min === undefined) return undefined;
      total += s.min * times;
    }
  }
  return total;
}

function stepText(s: { action: string; min?: number; km?: number }): string {
  const amount = s.km !== undefined ? `${s.km} km` : `${s.min} min`;
  return `${amount} ${s.action}`;
}

/** One line under a session card, e.g. "5 min walk + (4 min run / 1 min walk) × 4". */
export function workoutSummary(w: Workout): string {
  switch (w.kind) {
    case 'run':
      return w.items
        .map((i) => (isRepeat(i) ? `(${i.steps.map(stepText).join(' / ')}) × ${i.repeat}` : stepText(i)))
        .join(' + ');
    case 'weights':
      return `${w.exercises.length} exercises · full body`;
    case 'endurance': {
      const [a, b] = w.minutes;
      return `${a === b ? a : `${a}–${b}`} min easy`;
    }
  }
}

/** Rough duration label for the card, e.g. "~26 min". */
export function workoutLength(w: Workout): string | undefined {
  switch (w.kind) {
    case 'run': {
      const m = runMinutes(w);
      return m === undefined ? undefined : `~${formatDuration(m)}`;
    }
    case 'weights':
      return '~50 min';
    case 'endurance':
      return `${w.minutes[0]}–${w.minutes[1]} min`;
  }
}

export { isRepeat };
