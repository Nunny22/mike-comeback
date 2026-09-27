// Shapes for the programme config and for everything the app stores.
// The programme itself lives in programme.ts — edit that, not this.

/** The three planned sessions each week. Order here = order on the Today screen. */
export type SlotId = 'run' | 'weights' | 'endurance';

/** One step of a run. Give minutes OR km. */
export interface RunStep {
  action: 'walk' | 'run';
  min?: number;
  km?: number;
  note?: string;
}

/** A block of steps repeated N times, e.g. (4 min run + 1 min walk) × 4. */
export interface RunRepeat {
  repeat: number;
  steps: RunStep[];
}

export type RunItem = RunStep | RunRepeat;

export interface RunWorkout {
  kind: 'run';
  title: string;
  items: RunItem[];
  tips?: string[];
}

export interface Exercise {
  name: string;
  sets: number;
  /** A string so ranges work: "8", "10–12", "12–15". */
  reps: string;
  note?: string;
}

export interface WeightsWorkout {
  kind: 'weights';
  title: string;
  exercises: Exercise[];
  tips?: string[];
}

export type EnduranceActivity = 'bike' | 'hike';

export interface EnduranceWorkout {
  kind: 'endurance';
  title: string;
  /** Duration range in minutes, e.g. [60, 75]. */
  minutes: [number, number];
  options: EnduranceActivity[];
  tips?: string[];
}

export type Workout = RunWorkout | WeightsWorkout | EnduranceWorkout;

export interface ProgrammeWeek {
  /** Short theme shown on the week header, e.g. "Ease back in". */
  focus: string;
  sessions: {
    run: RunWorkout;
    weights: WeightsWorkout;
    endurance: EnduranceWorkout;
  };
}

export interface SlotDef {
  id: SlotId;
  label: string;
  short: string;
}

export interface Programme {
  name: string;
  /** YYYY-MM-DD — default Monday of week 1 on a fresh install (changeable in Settings). */
  startDate: string;
  /** Planned sessions per week that count as a successful week. */
  target: number;
  slots: SlotDef[];
  weeks: ProgrammeWeek[];
}

// ---------- Stored data ----------

export type ActivityKind = 'run' | 'weights' | 'bike' | 'hike' | 'walk' | 'other';

export interface SetLog {
  name: string;
  weightKg?: number;
  sets?: number;
  reps?: string;
}

export interface WorkoutLog {
  id: string;
  /** YYYY-MM-DD, local date the session was done. */
  date: string;
  kind: ActivityKind;
  /** Which planned session this completes. null = bonus activity. */
  slot: SlotId | null;
  /** Programme week the planned session belongs to (1-based). */
  week: number | null;
  durationMin?: number;
  distanceKm?: number;
  avgHr?: number;
  rpe?: number;
  notes?: string;
  exercises?: SetLog[];
  createdAt: string;
  updatedAt: string;
}

export interface BodyCheck {
  id: string;
  date: string;
  weightKg?: number;
  restingHr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  /** YYYY-MM-DD — the Monday of programme week 1. */
  startDate: string;
}

/** Workout edits made in the app, keyed by week number then slot. */
export type Overrides = Record<string, Partial<Record<SlotId, Workout>>>;

export interface AppState {
  version: 1;
  settings: Settings;
  logs: WorkoutLog[];
  body: BodyCheck[];
  overrides: Overrides;
}
