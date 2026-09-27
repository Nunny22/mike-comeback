// ============================================================
//  THE PROGRAMME — edit this file to change the plan.
// ============================================================
//
//  - Add/remove a week: add/remove an entry in `weeks`.
//  - Change when week 1 starts: edit startDate (a Monday, YYYY-MM-DD).
//  - Change the weights session everywhere: edit FULL_BODY below.
//  - Change one week only: edit that week's entry.
//  - Runs are a list of steps. Wrap steps in repeat(n, [...]) for intervals.
//      walk(5)          → 5 min walk
//      run(4)           → 4 min run
//      runKm(5, 'note') → run 5 km
//
//  Edits made inside the app (Workout → Edit) are stored on the device
//  and sit on top of this file. "Reset to plan" in the app removes them.

import type { EnduranceWorkout, Exercise, Programme, RunItem, RunStep, WeightsWorkout } from './types.ts';

const walk = (min: number, note?: string): RunStep => ({ action: 'walk', min, note });
const run = (min: number, note?: string): RunStep => ({ action: 'run', min, note });
const runKm = (km: number, note?: string): RunStep => ({ action: 'run', km, note });
const repeat = (times: number, steps: RunStep[]): RunItem => ({ repeat: times, steps });

const RUN_TIPS = [
  'Easy means conversational — you could speak in full sentences.',
  'If it feels hard, slow down or walk. That still counts.',
];

const FULL_BODY_EXERCISES: Exercise[] = [
  { name: 'Squat or leg press', sets: 3, reps: '8' },
  { name: 'Romanian deadlift', sets: 3, reps: '8' },
  { name: 'Bench press', sets: 3, reps: '8' },
  { name: 'Seated row', sets: 3, reps: '10' },
  { name: 'Lat pulldown', sets: 2, reps: '10' },
  { name: 'Shoulder press', sets: 2, reps: '10' },
  { name: 'Standing calf raises', sets: 3, reps: '12–15' },
  { name: 'Biceps', sets: 2, reps: '10–12' },
  { name: 'Triceps', sets: 2, reps: '10–12' },
];

const FULL_BODY = (tips: string[] = []): WeightsWorkout => ({
  kind: 'weights',
  title: 'Full-body weights',
  exercises: FULL_BODY_EXERCISES.map((e) => ({ ...e })),
  tips: [
    'Pick weights that leave 2–3 good reps in the tank.',
    'Rest 60–90 s between sets.',
    ...tips,
  ],
});

// Minutes are guidance, not a target: anything in the range counts.
const BIKE_OR_HIKE = (min: number, max: number, tips: string[] = []): EnduranceWorkout => ({
  kind: 'endurance',
  title: 'Long easy session',
  minutes: [min, max],
  options: ['bike', 'hike'],
  tips: [
    'The time range is guidance, not a target — anywhere in it counts.',
    'Steady, easy effort — you should finish wanting more.',
    ...tips,
  ],
});

export const programme: Programme = {
  name: '6-week comeback',
  startDate: '2026-09-28',
  target: 3,
  slots: [
    { id: 'run', label: 'Run', short: 'Run' },
    { id: 'weights', label: 'Weights', short: 'Weights' },
    { id: 'endurance', label: 'Bike or Hike', short: 'Bike/Hike' },
  ],
  weeks: [
    {
      focus: 'Ease back in',
      sessions: {
        run: {
          kind: 'run',
          title: 'Easy comeback run',
          items: [walk(5, 'Brisk warm-up walk'), repeat(4, [run(4, 'Easy'), walk(1)])],
          tips: RUN_TIPS,
        },
        weights: FULL_BODY(['First week: go lighter than you think. Learn the movements.']),
        endurance: BIKE_OR_HIKE(60, 75),
      },
    },
    {
      focus: 'Build the habit',
      sessions: {
        run: {
          kind: 'run',
          title: 'Longer run intervals',
          items: [walk(5, 'Brisk warm-up walk'), repeat(3, [run(6, 'Easy'), walk(1)])],
          tips: RUN_TIPS,
        },
        weights: FULL_BODY(),
        endurance: BIKE_OR_HIKE(60, 75),
      },
    },
    {
      focus: 'Two big blocks',
      sessions: {
        run: {
          kind: 'run',
          title: '10 + 10 run',
          items: [walk(5, 'Brisk warm-up walk'), run(10, 'Easy'), walk(1), run(10, 'Easy')],
          tips: RUN_TIPS,
        },
        weights: FULL_BODY(['If every set felt easy last week, add a small amount of weight.']),
        endurance: BIKE_OR_HIKE(60, 90),
      },
    },
    {
      focus: 'First continuous run',
      sessions: {
        run: {
          kind: 'run',
          title: '30 min continuous',
          items: [run(30, 'Easy, continuous')],
          tips: ['Start slower than feels necessary.', ...RUN_TIPS],
        },
        weights: FULL_BODY(),
        endurance: BIKE_OR_HIKE(60, 90),
      },
    },
    {
      focus: 'Extend',
      sessions: {
        run: {
          kind: 'run',
          title: '35 min continuous',
          items: [run(35, 'Easy, continuous')],
          tips: RUN_TIPS,
        },
        weights: FULL_BODY(),
        endurance: BIKE_OR_HIKE(60, 120),
      },
    },
    {
      focus: 'Benchmark',
      sessions: {
        run: {
          kind: 'run',
          title: 'Easy 5K benchmark',
          items: [walk(5, 'Warm-up walk'), runKm(5, 'Easy, even pace — this is a benchmark, not a race')],
          tips: ['Note your time and average HR. That is your new baseline.'],
        },
        weights: FULL_BODY(),
        endurance: BIKE_OR_HIKE(60, 120, ['If you go long, take water and a snack.']),
      },
    },
  ],
};
