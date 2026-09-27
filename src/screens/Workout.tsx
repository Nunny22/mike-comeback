import type { AppState, RunStep, SlotId, Workout as W } from '../data/types.ts';
import { programme } from '../data/programme.ts';
import { Icon } from '../components/Icon.tsx';
import { Section, SubHeader } from '../components/Screen.tsx';
import { formatDay } from '../lib/dates.ts';
import { kindLabel, lastWeights, logSummary } from '../lib/logs.ts';
import { clearOverride } from '../lib/store.ts';
import { getWorkout, isEdited, isRepeat, slotDef, slotLog, workoutLength } from '../lib/week.ts';

export function Workout({ state, week, slot }: { state: AppState; week: number; slot: SlotId }) {
  const workout = getWorkout(state, week, slot);
  const log = slotLog(state.logs, week, slot);
  const edited = isEdited(state, week, slot);

  return (
    <>
      <SubHeader backTo="today" eyebrow={`Week ${week} · ${programme.weeks[week - 1].focus}`} title={slotDef(slot).label} />

      <div class={`workout-head ${slot}`}>
        <p class="card-label">{workoutLength(workout) ?? 'Benchmark'}</p>
        <p class="big">{workout.title}</p>
        {edited && (
          <p style="margin-top:10px">
            <span class="pill edited">Edited</span>{' '}
            <button class="link-btn" onClick={() => confirm('Reset this session to the original plan?') && clearOverride(week, slot)}>
              Reset to plan
            </button>
          </p>
        )}
      </div>

      {log && (
        <a class="done-box" href={`#/log/${week}/${slot}`} style="text-decoration:none;color:inherit">
          <span class="tick">
            <Icon name="check" />
          </span>
          <span class="row-main">
            <span class="row-title">
              Done {formatDay(log.date)}
              {slot === 'endurance' ? ` · ${kindLabel[log.kind]}` : ''}
            </span>
            <span class="row-sub num">{logSummary(log) || 'Logged'}</span>
          </span>
          <Icon name="chevron" size={18} />
        </a>
      )}

      <WorkoutBody state={state} workout={workout} />

      {workout.tips && workout.tips.length > 0 && (
        <Section title="Notes">
          <ul class="tips">
            {workout.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>
      )}

      <div class="sticky-actions">
        <a class={`btn block ${log ? 'secondary' : 'accent'}`} style={`--c: var(--${slot})`} href={`#/log/${week}/${slot}`}>
          {log ? 'Edit log' : 'Log this session'}
        </a>
      </div>
      <div class="actions">
        <a class="btn secondary block" href={`#/workout/${week}/${slot}/edit`}>
          Edit workout
        </a>
      </div>
    </>
  );
}

function WorkoutBody({ state, workout }: { state: AppState; workout: W }) {
  switch (workout.kind) {
    case 'run':
      return (
        <Section title="Session">
          <div class="steps">
            {workout.items.map((item, i) =>
              isRepeat(item) ? (
                <div class="repeat" key={i}>
                  <p class="repeat-label">Repeat × {item.repeat}</p>
                  {item.steps.map((s, j) => (
                    <Step key={j} step={s} />
                  ))}
                </div>
              ) : (
                <Step key={i} step={item} />
              ),
            )}
          </div>
        </Section>
      );
    case 'weights': {
      const last = lastWeights(state.logs);
      return (
        <Section title="Exercises">
          <div class="list">
            {workout.exercises.map((e, i) => {
              const prev = last.get(e.name.toLowerCase());
              return (
                <div class="exercise" key={i}>
                  <div>
                    <p class="exercise-name">{e.name}</p>
                    {(prev || e.note) && (
                      <p class="row-sub num">{[prev && `Last: ${prev.weightKg} kg`, e.note].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <p class="exercise-sets">
                    {e.sets} × {e.reps}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      );
    }
    case 'endurance': {
      const [a, b] = workout.minutes;
      return (
        <Section title="Session">
          <div class="step">
            <span class="step-amount">{a === b ? a : `${a}–${b}`} min</span>
            <span>
              <span class="step-action">{workout.options.map((o, i) => (i ? kindLabel[o].toLowerCase() : kindLabel[o])).join(' or ')} at an easy, steady effort</span>
              <span class="step-note">The time is guidance, not a target — anywhere in the range counts.</span>
            </span>
          </div>
        </Section>
      );
    }
  }
}

function Step({ step }: { step: RunStep }) {
  return (
    <div class={`step ${step.action}`}>
      <span class="step-amount">{step.km !== undefined ? `${step.km} km` : `${step.min} min`}</span>
      <span>
        <span class="step-action">{step.action === 'run' ? 'Run' : 'Walk'}</span>
        {step.note && <span class="step-note">{step.note}</span>}
      </span>
    </div>
  );
}
