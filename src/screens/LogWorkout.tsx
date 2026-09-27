import { useState } from 'preact/hooks';
import type { ActivityKind, AppState, SlotId, WorkoutLog } from '../data/types.ts';
import { Field, Segmented } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { Section, SubHeader } from '../components/Screen.tsx';
import { todayISO } from '../lib/dates.ts';
import { formatClock, num, parseDuration } from '../lib/format.ts';
import { hasDistance, kindLabel, lastWeights, paceOrSpeed } from '../lib/logs.ts';
import { deleteLog, saveLog } from '../lib/store.ts';
import { getWorkout, slotDef, slotLog } from '../lib/week.ts';
import { go } from '../router.ts';

const BONUS_KINDS: ActivityKind[] = ['run', 'bike', 'hike', 'walk', 'weights', 'other'];
const RPE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface SetDraft {
  name: string;
  weight: string;
  sets: string;
  reps: string;
}

const str = (n?: number) => (n === undefined ? '' : String(n));

/** Planned session: week + slot. Bonus: slot null, optional existing log id. */
export function LogWorkout({ state, week, slot, logId }: { state: AppState; week: number | null; slot: SlotId | null; logId?: string }) {
  const existing = slot && week ? slotLog(state.logs, week, slot) : state.logs.find((l) => l.id === logId);
  const workout = slot && week ? getWorkout(state, week, slot) : undefined;
  const last = lastWeights(state.logs);

  const defaultKind: ActivityKind =
    workout?.kind === 'endurance' ? workout.options[0] : workout?.kind === 'weights' ? 'weights' : workout ? 'run' : 'walk';

  const [kind, setKind] = useState<ActivityKind>(existing?.kind ?? defaultKind);
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [duration, setDuration] = useState(existing?.durationMin ? formatClock(existing.durationMin) : '');
  const [distance, setDistance] = useState(str(existing?.distanceKm));
  const [avgHr, setAvgHr] = useState(str(existing?.avgHr));
  const [rpe, setRpe] = useState<number | undefined>(existing?.rpe);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [sets, setSets] = useState<SetDraft[]>(() =>
    existing?.exercises
      ? existing.exercises.map((e) => ({ name: e.name, weight: str(e.weightKg), sets: str(e.sets), reps: e.reps ?? '' }))
      : workout?.kind === 'weights'
        ? workout.exercises.map((e) => ({ name: e.name, weight: '', sets: String(e.sets), reps: e.reps }))
        : [],
  );

  const durationMin = parseDuration(duration);
  const distanceKm = num(distance);
  const computed = paceOrSpeed(kind, durationMin, distanceKm);
  const backTo = slot && week ? `workout/${week}/${slot}` : 'today';

  const updateSet = (i: number, patch: Partial<SetDraft>) => setSets(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  function save(e: Event) {
    e.preventDefault();
    const log: Omit<WorkoutLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      id: existing?.id,
      date,
      kind,
      slot,
      week: slot ? week : null,
      durationMin,
      distanceKm: hasDistance(kind) ? distanceKm : undefined,
      avgHr: num(avgHr),
      rpe,
      notes: notes.trim() || undefined,
      exercises:
        kind === 'weights'
          ? sets
              .filter((s) => s.name.trim())
              .map((s) => ({ name: s.name.trim(), weightKg: num(s.weight), sets: num(s.sets), reps: s.reps.trim() || undefined }))
          : undefined,
    };
    saveLog(log);
    go('today');
  }

  function remove() {
    if (existing && confirm('Delete this log?')) {
      deleteLog(existing.id);
      go('today');
    }
  }

  return (
    <>
      <SubHeader
        backTo={backTo}
        eyebrow={slot && week ? `Week ${week} · ${slotDef(slot).label}` : 'Bonus activity'}
        title={existing ? 'Edit log' : 'Log session'}
      />

      <form class="form" onSubmit={save}>
        {!slot && (
          <Field label="Activity">
            <Segmented options={BONUS_KINDS} value={kind} onChange={setKind} label={(k) => kindLabel[k]} />
          </Field>
        )}
        {workout?.kind === 'endurance' && (
          <Field label="Which one?">
            <Segmented options={workout.options} value={kind as 'bike' | 'hike'} onChange={setKind} label={(k) => kindLabel[k]} />
          </Field>
        )}

        <Field label="Date">
          <input class="input" type="date" required value={date} max={todayISO()} onInput={(e) => setDate(e.currentTarget.value)} />
        </Field>

        <div class="grid-2">
          <Field label="Duration" hint="45 or 45:30">
            <input class="input num" inputMode="decimal" placeholder="min" value={duration} onInput={(e) => setDuration(e.currentTarget.value)} />
          </Field>
          {hasDistance(kind) ? (
            <Field label="Distance (km)">
              <input class="input num" inputMode="decimal" placeholder="km" value={distance} onInput={(e) => setDistance(e.currentTarget.value)} />
            </Field>
          ) : (
            <span />
          )}
        </div>

        {computed && (
          <div class="computed num">
            <span class="muted">{kind === 'run' || kind === 'walk' ? 'Pace' : 'Speed'}</span>
            <span>{computed}</span>
          </div>
        )}

        <Field label="Average HR" hint="Optional">
          <input class="input num" inputMode="numeric" placeholder="bpm" value={avgHr} onInput={(e) => setAvgHr(e.currentTarget.value)} />
        </Field>

        <div class="field">
          <span class="field-label">How did it feel?</span>
          <Segmented class="segmented rpe" options={RPE} value={rpe} onChange={(v) => setRpe(v === rpe ? undefined : v)} />
          <div class="rpe-scale">
            <span>1 · very easy</span>
            <span>10 · all out</span>
          </div>
        </div>

        {kind === 'weights' && (
          <Section title="Weights">
            <div class="list">
              {sets.map((s, i) => {
                const prev = last.get(s.name.toLowerCase());
                return (
                  <div class="set-row" key={i}>
                    <div style="display:flex;gap:8px;align-items:center">
                      <input
                        class="input"
                        aria-label="Exercise"
                        placeholder="Exercise"
                        value={s.name}
                        onInput={(e) => updateSet(i, { name: e.currentTarget.value })}
                      />
                      <button type="button" class="icon-btn" aria-label="Remove exercise" onClick={() => setSets(sets.filter((_, j) => j !== i))}>
                        <Icon name="close" size={20} />
                      </button>
                    </div>
                    <div class="grid-3">
                      <label class="field">
                        <span class="mini-label">Kg</span>
                        <input
                          class="input num"
                          inputMode="decimal"
                          placeholder={prev ? String(prev.weightKg) : '–'}
                          value={s.weight}
                          onInput={(e) => updateSet(i, { weight: e.currentTarget.value })}
                        />
                      </label>
                      <label class="field">
                        <span class="mini-label">Sets</span>
                        <input class="input num" inputMode="numeric" value={s.sets} onInput={(e) => updateSet(i, { sets: e.currentTarget.value })} />
                      </label>
                      <label class="field">
                        <span class="mini-label">Reps</span>
                        <input class="input num" value={s.reps} onInput={(e) => updateSet(i, { reps: e.currentTarget.value })} />
                      </label>
                    </div>
                  </div>
                );
              })}
              <button type="button" class="btn secondary block" onClick={() => setSets([...sets, { name: '', weight: '', sets: '3', reps: '10' }])}>
                <Icon name="plus" size={20} /> Add exercise
              </button>
            </div>
          </Section>
        )}

        <Field label="Notes">
          <textarea class="input" placeholder="Anything worth remembering" value={notes} onInput={(e) => setNotes(e.currentTarget.value)} />
        </Field>

        <div class="sticky-actions">
          <button class="btn block accent" style={slot ? `--c: var(--${slot})` : '--c: var(--ink)'} type="submit">
            <Icon name="check" size={20} /> {existing ? 'Save changes' : 'Mark as done'}
          </button>
        </div>
        {existing && (
          <button type="button" class="btn danger block" onClick={remove}>
            Delete log
          </button>
        )}
      </form>
    </>
  );
}
