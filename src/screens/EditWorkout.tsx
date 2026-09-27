import { useState } from 'preact/hooks';
import type { AppState, EnduranceActivity, RunItem, RunStep, SlotId, Workout } from '../data/types.ts';
import { Field, Segmented } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { Section, SubHeader } from '../components/Screen.tsx';
import { num } from '../lib/format.ts';
import { clearOverride, setOverride } from '../lib/store.ts';
import { getWorkout, isEdited, isRepeat, slotDef, weekCount } from '../lib/week.ts';
import { go } from '../router.ts';

type Scope = 'this' | 'onwards';

/** Move item i by d (-1 up, +1 down) in place. */
function move<T>(arr: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

export function EditWorkout({ state, week, slot }: { state: AppState; week: number; slot: SlotId }) {
  const [draft, setDraft] = useState<Workout>(() => structuredClone(getWorkout(state, week, slot)));
  const [scope, setScope] = useState<Scope>('this');
  // Bumped on add/remove/reorder so uncontrolled inputs remount with fresh values.
  const [rev, setRev] = useState(0);
  const back = `workout/${week}/${slot}`;

  /** Edit a copy of the draft. Pass structural=true when rows are added, removed or moved. */
  function update(fn: (d: Workout) => void, structural = false) {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    if (structural) setRev(rev + 1);
  }

  function save(e: Event) {
    e.preventDefault();
    const weeks = scope === 'this' ? [week] : Array.from({ length: weekCount() - week + 1 }, (_, i) => week + i);
    setOverride(weeks, slot, draft);
    go(back);
  }

  function reset() {
    if (confirm('Reset this session to the original plan?')) {
      clearOverride(week, slot);
      go(back);
    }
  }

  return (
    <>
      <SubHeader backTo={back} eyebrow={`Week ${week} · ${slotDef(slot).label}`} title="Edit workout" />

      <form class="form" onSubmit={save}>
        <Field label="Title">
          <input class="input" required defaultValue={draft.title} onInput={(e) => update((d) => (d.title = e.currentTarget.value))} />
        </Field>

        {draft.kind === 'run' && <RunEditor key={rev} items={draft.items} update={(fn, s) => update((d) => d.kind === 'run' && fn(d.items), s)} />}

        {draft.kind === 'weights' && (
          <Section title="Exercises">
            <div class="list" key={rev}>
              {draft.exercises.map((ex, i) => (
                <div class="edit-row" key={i}>
                  <div class="stack" style="gap:8px">
                    <input
                      class="input"
                      aria-label="Exercise name"
                      defaultValue={ex.name}
                      onInput={(e) => update((d) => d.kind === 'weights' && (d.exercises[i].name = e.currentTarget.value))}
                    />
                    <div class="grid-2">
                      <label class="field">
                        <span class="mini-label">Sets</span>
                        <input
                          class="input num"
                          inputMode="numeric"
                          defaultValue={String(ex.sets)}
                          onInput={(e) => update((d) => d.kind === 'weights' && (d.exercises[i].sets = num(e.currentTarget.value) ?? 0))}
                        />
                      </label>
                      <label class="field">
                        <span class="mini-label">Reps</span>
                        <input
                          class="input num"
                          defaultValue={ex.reps}
                          onInput={(e) => update((d) => d.kind === 'weights' && (d.exercises[i].reps = e.currentTarget.value))}
                        />
                      </label>
                    </div>
                    <input
                      class="input"
                      aria-label="Note"
                      placeholder="Note (optional)"
                      defaultValue={ex.note ?? ''}
                      onInput={(e) => update((d) => d.kind === 'weights' && (d.exercises[i].note = e.currentTarget.value || undefined))}
                    />
                  </div>
                  <RowControls
                    first={i === 0}
                    last={i === draft.exercises.length - 1}
                    onMove={(dir) => update((d) => d.kind === 'weights' && move(d.exercises, i, dir), true)}
                    onRemove={() => update((d) => d.kind === 'weights' && d.exercises.splice(i, 1), true)}
                  />
                </div>
              ))}
              <button
                type="button"
                class="btn secondary block"
                onClick={() => update((d) => d.kind === 'weights' && d.exercises.push({ name: 'New exercise', sets: 3, reps: '10' }), true)}
              >
                <Icon name="plus" size={20} /> Add exercise
              </button>
            </div>
          </Section>
        )}

        {draft.kind === 'endurance' && (
          <>
            <div class="grid-2">
              <Field label="Min minutes">
                <input
                  class="input num"
                  inputMode="numeric"
                  defaultValue={String(draft.minutes[0])}
                  onInput={(e) => update((d) => d.kind === 'endurance' && (d.minutes[0] = num(e.currentTarget.value) ?? 0))}
                />
              </Field>
              <Field label="Max minutes">
                <input
                  class="input num"
                  inputMode="numeric"
                  defaultValue={String(draft.minutes[1])}
                  onInput={(e) => update((d) => d.kind === 'endurance' && (d.minutes[1] = num(e.currentTarget.value) ?? 0))}
                />
              </Field>
            </div>
            <Field label="Options">
              <Segmented<'bike' | 'hike' | 'both'>
                options={['bike', 'hike', 'both']}
                value={draft.options.length === 2 ? 'both' : draft.options[0]}
                onChange={(v) => update((d) => d.kind === 'endurance' && (d.options = v === 'both' ? ['bike', 'hike'] : [v as EnduranceActivity]))}
              />
            </Field>
          </>
        )}

        <Field label="Notes" hint="One per line">
          <textarea
            class="input"
            defaultValue={(draft.tips ?? []).join('\n')}
            onInput={(e) => update((d) => (d.tips = e.currentTarget.value.split('\n').map((t) => t.trim()).filter(Boolean)))}
          />
        </Field>

        {week < weekCount() && (
          <Field label="Apply to">
            <Segmented<Scope>
              options={['this', 'onwards']}
              value={scope}
              onChange={setScope}
              label={(s) => (s === 'this' ? `Week ${week} only` : `Week ${week} onwards`)}
            />
          </Field>
        )}

        <div class="sticky-actions">
          <button class="btn block" type="submit">
            Save workout
          </button>
        </div>
        {isEdited(state, week, slot) && (
          <button type="button" class="btn danger block" onClick={reset}>
            Reset to original plan
          </button>
        )}
      </form>
    </>
  );
}

function RowControls({ first, last, onMove, onRemove }: { first: boolean; last: boolean; onMove: (d: number) => void; onRemove: () => void }) {
  return (
    <div class="controls">
      <button type="button" class="icon-btn" aria-label="Move up" disabled={first} onClick={() => onMove(-1)}>
        <Icon name="up" size={20} />
      </button>
      <button type="button" class="icon-btn" aria-label="Move down" disabled={last} onClick={() => onMove(1)}>
        <Icon name="down" size={20} />
      </button>
      <button type="button" class="icon-btn" aria-label="Remove" onClick={onRemove}>
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}

type ItemsUpdate = (fn: (items: RunItem[]) => void, structural?: boolean) => void;

function RunEditor({ items, update }: { items: RunItem[]; update: ItemsUpdate }) {
  return (
    <Section title="Steps">
      <div class="list">
        {items.map((item, i) => {
          const controls = (
            <RowControls
              first={i === 0}
              last={i === items.length - 1}
              onMove={(d) => update((its) => move(its, i, d), true)}
              onRemove={() => update((its) => its.splice(i, 1), true)}
            />
          );
          if (!isRepeat(item)) {
            return (
              <div class="edit-row" key={i}>
                <StepEditor step={item} update={(fn) => update((its) => fn(its[i] as RunStep))} />
                {controls}
              </div>
            );
          }
          return (
            <div class="edit-repeat" key={i}>
              <div class="edit-row" style="background:none;padding:0">
                <label class="field">
                  <span class="field-label">Repeat block × times</span>
                  <input
                    class="input num"
                    inputMode="numeric"
                    defaultValue={String(item.repeat)}
                    onInput={(e) => update((its) => isRepeat(its[i]) && ((its[i] as { repeat: number }).repeat = num(e.currentTarget.value) ?? 1))}
                  />
                </label>
                {controls}
              </div>
              {item.steps.map((s, j) => (
                <div class="edit-row" key={j}>
                  <StepEditor step={s} update={(fn) => update((its) => isRepeat(its[i]) && fn(its[i].steps[j]))} />
                  <RowControls
                    first={j === 0}
                    last={j === item.steps.length - 1}
                    onMove={(d) => update((its) => isRepeat(its[i]) && move(its[i].steps, j, d), true)}
                    onRemove={() => update((its) => isRepeat(its[i]) && its[i].steps.splice(j, 1), true)}
                  />
                </div>
              ))}
              <button
                type="button"
                class="btn ghost small"
                onClick={() => update((its) => isRepeat(its[i]) && its[i].steps.push({ action: 'walk', min: 1 }), true)}
              >
                <Icon name="plus" size={18} /> Step in block
              </button>
            </div>
          );
        })}
        <div class="grid-2">
          <button type="button" class="btn secondary small" onClick={() => update((its) => its.push({ action: 'run', min: 5 }), true)}>
            <Icon name="plus" size={18} /> Step
          </button>
          <button
            type="button"
            class="btn secondary small"
            onClick={() => update((its) => its.push({ repeat: 3, steps: [{ action: 'run', min: 5 }, { action: 'walk', min: 1 }] }), true)}
          >
            <Icon name="plus" size={18} /> Repeat block
          </button>
        </div>
      </div>
    </Section>
  );
}

function StepEditor({ step, update }: { step: RunStep; update: (fn: (s: RunStep) => void) => void }) {
  const unit = step.km !== undefined ? 'km' : 'min';
  return (
    <div class="stack" style="gap:8px">
      <Segmented<RunStep['action']> options={['walk', 'run']} value={step.action} onChange={(a) => update((s) => (s.action = a))} />
      <div class="grid-2">
        <input
          class="input num"
          inputMode="decimal"
          aria-label={unit === 'km' ? 'Kilometres' : 'Minutes'}
          defaultValue={String(step.km ?? step.min ?? '')}
          onInput={(e) =>
            update((s) => {
              const v = num(e.currentTarget.value);
              if (unit === 'km') s.km = v;
              else s.min = v;
            })
          }
        />
        <Segmented<'min' | 'km'>
          options={['min', 'km']}
          value={unit}
          onChange={(u) =>
            update((s) => {
              const v = s.km ?? s.min;
              delete s.km;
              delete s.min;
              if (u === 'km') s.km = v;
              else s.min = v;
            })
          }
        />
      </div>
      <input
        class="input"
        aria-label="Note"
        placeholder="Note (optional)"
        defaultValue={step.note ?? ''}
        onInput={(e) => update((s) => (s.note = e.currentTarget.value || undefined))}
      />
    </div>
  );
}
