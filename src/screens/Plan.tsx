import { useState } from 'preact/hooks';
import type { AppState } from '../data/types.ts';
import { programme } from '../data/programme.ts';
import { Icon } from '../components/Icon.tsx';
import { formatShortDate, todayISO } from '../lib/dates.ts';
import { bonusLogs, currentWeek, getWorkout, isEdited, sessionName, slotIds, slotLog, weekDates, weekSummary, workoutSummary } from '../lib/week.ts';

export function Plan({ state }: { state: AppState }) {
  const now = currentWeek(state.settings.startDate, todayISO());
  const [open, setOpen] = useState<number | null>(now);

  return (
    <>
      <header class="hero">
        <p class="eyebrow">{programme.name}</p>
        <h1 class="page-title">Plan</h1>
        <p class="lede">
          {programme.target} sessions a week. Tap a week to see it, then a session to view or edit it.
        </p>
      </header>

      {programme.weeks.map((w, i) => {
        const week = i + 1;
        const summary = weekSummary(state, week);
        const { from, to } = weekDates(state.settings.startDate, week);
        const bonus = bonusLogs(state, week).length;
        const isOpen = open === week;
        return (
          <div key={week} class={`week ${week === now ? 'is-current' : ''}`}>
            <button class="week-summary" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : week)}>
              <span class="week-num num">{week}</span>
              <span class="row-main">
                <span class="row-title">
                  {w.focus}
                  {week === now ? ' · this week' : ''}
                </span>
                <span class="row-sub num">
                  {formatShortDate(from)}–{formatShortDate(to)} · {summary.count}/{summary.target}
                  {bonus ? ` · +${bonus} bonus` : ''}
                </span>
              </span>
              <span class="dots" aria-hidden="true">
                {slotIds().map((s) => (
                  <span key={s} class={summary.done.includes(s) ? s : ''} />
                ))}
              </span>
            </button>
            {isOpen && (
              <div class="week-body">
                {slotIds().map((slot) => {
                  const workout = getWorkout(state, week, slot);
                  const done = slotLog(state.logs, week, slot);
                  const name = sessionName(slot, workout);
                  return (
                    <a key={slot} class="row" href={`#/workout/${week}/${slot}`}>
                      <span class="row-icon" style={`background:var(--${slot}-soft);color:var(--${slot})`}>
                        <Icon name={done ? 'check' : slot} size={20} />
                      </span>
                      <span class="row-main">
                        <span class="row-title">
                          {name.label ? `${name.label} · ${name.title}` : name.title}
                          {isEdited(state, week, slot) ? ' (edited)' : ''}
                        </span>
                        <span class="row-sub">{workoutSummary(workout)}</span>
                      </span>
                      <Icon name="chevron" size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
