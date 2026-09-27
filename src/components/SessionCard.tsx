import type { SlotId, Workout, WorkoutLog } from '../data/types.ts';
import { formatDay } from '../lib/dates.ts';
import { kindLabel } from '../lib/logs.ts';
import { sessionName, workoutLength } from '../lib/week.ts';
import { Icon } from './Icon.tsx';

interface Props {
  week: number;
  slot: SlotId;
  workout: Workout;
  log?: WorkoutLog;
  isNext: boolean;
}

export function SessionCard({ week, slot, workout, log, isNext }: Props) {
  const done = Boolean(log);
  const name = sessionName(slot, workout);
  // Once a bike/hike is logged, say which one it was.
  const label = done && slot === 'endurance' && log ? kindLabel[log.kind] : name.label;
  const meta = done && log ? `Done ${formatDay(log.date)}` : workoutLength(workout);

  return (
    <a
      href={`#/workout/${week}/${slot}`}
      class={`card ${slot} ${done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`}
    >
      <span class="card-icon">
        <Icon name={done ? 'check' : slot} size={26} />
      </span>
      <span>
        {label && <span class="card-label">{label}</span>}
        <span class="card-title">{workout.title}</span>
        {meta && <span class="card-meta num">{meta}</span>}
      </span>
      {done ? (
        <span class="pill done">Done</span>
      ) : isNext ? (
        <span class="pill next">Next</span>
      ) : (
        <span class="pill">To do</span>
      )}
    </a>
  );
}
