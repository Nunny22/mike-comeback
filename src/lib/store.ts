// App state: one object, saved through the storage adapter on every change.
// Components read it with useAppState() and change it with the actions below.

import { useEffect, useState } from 'preact/hooks';
import type { AppState, BodyCheck, Overrides, SlotId, Workout, WorkoutLog } from '../data/types.ts';
import { emptyState, localAdapter, normalise, type StorageAdapter } from './storage.ts';

const adapter: StorageAdapter = localAdapter;

let state: AppState = adapter.load() ?? emptyState();
const listeners = new Set<() => void>();

function set(next: AppState) {
  state = next;
  adapter.save(state);
  listeners.forEach((l) => l());
}

export const getState = () => state;

export function useAppState(): AppState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
}

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const now = () => new Date().toISOString();

// ---------- Workout logs ----------

export function saveLog(log: Omit<WorkoutLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const existing = log.id ? state.logs.find((l) => l.id === log.id) : undefined;
  const record: WorkoutLog = {
    ...log,
    id: existing?.id ?? uid(),
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  // A planned session has one log per week: replace any other log in that slot.
  const others = state.logs.filter(
    (l) => l.id !== record.id && !(record.slot && l.slot === record.slot && l.week === record.week),
  );
  set({ ...state, logs: [...others, record] });
  return record;
}

export function deleteLog(id: string) {
  set({ ...state, logs: state.logs.filter((l) => l.id !== id) });
}

// ---------- Body check-ins ----------

export function saveBody(check: Omit<BodyCheck, 'id' | 'createdAt' | 'updatedAt'>) {
  // One check-in per day: saving again on the same date updates it.
  const existing = state.body.find((b) => b.date === check.date);
  const record: BodyCheck = {
    ...existing,
    ...check,
    id: existing?.id ?? uid(),
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  set({ ...state, body: [...state.body.filter((b) => b.id !== record.id), record] });
}

export function deleteBody(id: string) {
  set({ ...state, body: state.body.filter((b) => b.id !== id) });
}

// ---------- Workout edits ----------

export function setOverride(weeks: number[], slot: SlotId, workout: Workout) {
  const overrides = { ...state.overrides };
  for (const w of weeks) overrides[w] = { ...overrides[w], [slot]: structuredClone(workout) };
  set({ ...state, overrides });
}

export function clearOverride(week: number, slot: SlotId) {
  const forWeek = { ...state.overrides[week] };
  delete forWeek[slot];
  const overrides: Overrides = { ...state.overrides, [week]: forWeek };
  if (Object.keys(forWeek).length === 0) delete overrides[week];
  set({ ...state, overrides });
}

// ---------- Settings & data ----------

export function setStartDate(startDate: string) {
  set({ ...state, settings: { ...state.settings, startDate } });
}

export function exportState(): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string) {
  set(normalise(JSON.parse(json)));
}

export function resetAll() {
  set(emptyState());
}
