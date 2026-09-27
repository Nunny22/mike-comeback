import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, daysBetween, mondayOf } from './dates.ts';
import { formatClock, formatPace, parseDuration } from './format.ts';
import { bonusLogs, currentWeek, getWorkout, rawWeekFor, runMinutes, weekSummary, workoutSummary } from './week.ts';
import { emptyState, normalise } from './storage.ts';
import type { AppState, RunWorkout, WorkoutLog } from '../data/types.ts';

const log = (p: Partial<WorkoutLog>): WorkoutLog => ({
  id: Math.random().toString(36),
  date: '2026-09-28',
  kind: 'run',
  slot: null,
  week: null,
  createdAt: '',
  updatedAt: '',
  ...p,
});

const withStart = (startDate: string, logs: WorkoutLog[] = []): AppState => ({
  ...emptyState(),
  settings: { startDate },
  logs,
});

test('dates: monday, add, diff across DST', () => {
  assert.equal(mondayOf('2026-10-04'), '2026-09-28'); // Sunday → previous Monday
  assert.equal(mondayOf('2026-09-28'), '2026-09-28');
  assert.equal(addDays('2026-10-24', 7), '2026-10-31');
  assert.equal(daysBetween('2026-10-20', '2026-10-27'), 7); // UK clocks change 25 Oct
});

test('format: durations and pace', () => {
  assert.equal(parseDuration('45'), 45);
  assert.equal(parseDuration('32:30'), 32.5);
  assert.equal(parseDuration('1:05:00'), 65);
  assert.equal(parseDuration(''), undefined);
  assert.equal(parseDuration('abc'), undefined);
  assert.equal(formatClock(32.5), '32:30');
  assert.equal(formatPace(31, 5), '6:12 /km');
});

test('week numbering is clamped to the programme', () => {
  assert.equal(rawWeekFor('2026-09-28', '2026-09-27'), 0);
  assert.equal(currentWeek('2026-09-28', '2026-09-27'), 1);
  assert.equal(currentWeek('2026-09-28', '2026-10-04'), 1);
  assert.equal(currentWeek('2026-09-28', '2026-10-05'), 2);
  assert.equal(currentWeek('2026-09-28', '2027-01-01'), 6);
});

test('week summary counts planned sessions and picks the next one', () => {
  const s = withStart('2026-09-28', [
    log({ slot: 'weights', week: 1, kind: 'weights' }),
    log({ slot: null, kind: 'walk' }), // bonus, does not count
    log({ slot: 'run', week: 2 }), // other week
  ]);
  const w1 = weekSummary(s, 1);
  assert.equal(w1.count, 1);
  assert.equal(w1.next, 'run');
  assert.equal(w1.complete, false);
  assert.equal(bonusLogs(s, 1).length, 1);
  assert.equal(bonusLogs(s, 2).length, 0);
});

test('run descriptions and overrides', () => {
  const s = withStart('2026-09-28');
  const w1 = getWorkout(s, 1, 'run') as RunWorkout;
  assert.equal(runMinutes(w1), 25);
  assert.equal(workoutSummary(w1), '5 min walk + (4 min run / 1 min walk) × 4');
  assert.equal(runMinutes(getWorkout(s, 6, 'run') as RunWorkout), undefined); // 5K is distance-based

  const edited: RunWorkout = { ...w1, items: [{ action: 'run', min: 20 }] };
  s.overrides[1] = { run: edited };
  assert.equal(workoutSummary(getWorkout(s, 1, 'run')), '20 min run');
  assert.equal(workoutSummary(getWorkout(s, 2, 'run')), '5 min walk + (6 min run / 1 min walk) × 3');
});

test('normalise tolerates junk and partial backups', () => {
  assert.deepEqual(normalise(null).logs, []);
  const n = normalise({ settings: { startDate: '2026-01-05' }, logs: [log({})] });
  assert.equal(n.settings.startDate, '2026-01-05');
  assert.equal(n.logs.length, 1);
  assert.deepEqual(n.overrides, {});
});

test('fresh install starts week 1 on Monday 28 September 2026', () => {
  const s = emptyState();
  assert.equal(s.settings.startDate, '2026-09-28');
  assert.equal(mondayOf(s.settings.startDate), '2026-09-28');
  assert.equal(rawWeekFor(s.settings.startDate, '2026-09-27'), 0); // day before: not started
  assert.equal(currentWeek(s.settings.startDate, '2026-10-04'), 1);
});

test('bike/hike guidance ranges', () => {
  const s = emptyState();
  const ranges = [1, 2, 3, 4, 5, 6].map((w) => {
    const e = getWorkout(s, w, 'endurance');
    return e.kind === 'endurance' ? e.minutes.join('–') : '';
  });
  assert.deepEqual(ranges, ['60–75', '60–75', '60–90', '60–90', '60–120', '60–120']);
  assert.equal(workoutSummary(getWorkout(s, 5, 'endurance')), '60–120 min easy (guide)');
});

test('an in-app edit never alters the base programme', async () => {
  const { programme } = await import('../data/programme.ts');
  const before = JSON.stringify(programme);
  const s = emptyState();
  const edited = structuredClone(getWorkout(s, 2, 'weights'));
  if (edited.kind === 'weights') edited.exercises[0].sets = 5;
  s.overrides[2] = { weights: edited };
  const w2 = getWorkout(s, 2, 'weights');
  const w3 = getWorkout(s, 3, 'weights');
  assert.equal(w2.kind === 'weights' && w2.exercises[0].sets, 5);
  assert.equal(w3.kind === 'weights' && w3.exercises[0].sets, 3);
  assert.equal(JSON.stringify(programme), before);
});
