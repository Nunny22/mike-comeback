// Persistence adapter. V1 stores everything in localStorage on this device.
// To add cloud sync later (e.g. Supabase), implement StorageAdapter and swap
// it in store.ts. Records already carry ids and timestamps for merging.

import type { AppState } from '../data/types.ts';
import { programme } from '../data/programme.ts';

export interface StorageAdapter {
  load(): AppState | null;
  save(state: AppState): void;
}

const KEY = 'mike-comeback:v1';

export function emptyState(): AppState {
  return {
    version: 1,
    settings: { startDate: programme.startDate },
    logs: [],
    body: [],
    overrides: {},
  };
}

/** Fill in anything missing so older or hand-edited backups still load. */
export function normalise(raw: unknown): AppState {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    version: 1,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    logs: Array.isArray(r.logs) ? r.logs : [],
    body: Array.isArray(r.body) ? r.body : [],
    overrides: r.overrides && typeof r.overrides === 'object' ? r.overrides : {},
  };
}

export const localAdapter: StorageAdapter = {
  load() {
    try {
      const text = localStorage.getItem(KEY);
      return text ? normalise(JSON.parse(text)) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked (e.g. private mode). The app keeps working in memory.
    }
  },
};
