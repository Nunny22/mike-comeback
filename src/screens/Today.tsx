import type { AppState, WorkoutLog } from '../data/types.ts';
import { programme } from '../data/programme.ts';
import { Icon } from '../components/Icon.tsx';
import { Section } from '../components/Screen.tsx';
import { SessionCard } from '../components/SessionCard.tsx';
import { formatDay, formatShortDate, todayISO } from '../lib/dates.ts';
import { kindLabel, logSummary } from '../lib/logs.ts';
import { bonusLogs, currentWeek, getWorkout, rawWeekFor, slotDef, slotIds, slotLog, weekCount, weekDates, weekSummary } from '../lib/week.ts';

export function Today({ state }: { state: AppState }) {
  const today = todayISO();
  const start = state.settings.startDate;
  const raw = rawWeekFor(start, today);
  const week = currentWeek(start, today);
  const summary = weekSummary(state, week);
  const { from, to } = weekDates(start, week);
  const bonus = bonusLogs(state, week);
  const plan = programme.weeks[week - 1];

  return (
    <>
      {raw < 1 && <p class="banner">Week 1 officially starts {formatDay(start)}. Nothing stopping you starting early.</p>}
      {raw > weekCount() && (
        <p class="banner">
          You've reached the end of the {programme.name}. Keep logging, or <a href="#/settings">start a new block</a>.
        </p>
      )}

      <header class="hero">
        <p class="eyebrow">
          Week {week} of {weekCount()} · {formatShortDate(from)}–{formatShortDate(to)}
        </p>
        <p class="hero-count num">
          {summary.count} <span class="of">of {summary.target} done</span>
        </p>
        <div class="hero-bar" aria-hidden="true">
          {slotIds().map((s) => (
            <span key={s} class={summary.done.includes(s) ? s : ''} />
          ))}
        </div>
        <p class="hero-next">
          {summary.complete
            ? 'Week done. Anything else is a bonus.'
            : `Next up: ${slotDef(summary.next!).label.toLowerCase()} — ${plan.focus.toLowerCase()}.`}
        </p>
      </header>

      <div class="cards">
        {slotIds().map((slot) => (
          <SessionCard
            key={slot}
            week={week}
            slot={slot}
            workout={getWorkout(state, week, slot)}
            log={slotLog(state.logs, week, slot)}
            isNext={summary.next === slot}
          />
        ))}
      </div>

      <Section title="Bonus">
        <div class="list">
          {bonus.length === 0 && <p class="empty">Extra walks, rides or sessions show up here. Entirely optional.</p>}
          {bonus.map((l) => (
            <BonusRow key={l.id} log={l} />
          ))}
          <a class="btn secondary block" href="#/log/bonus">
            <Icon name="plus" size={20} /> Log a bonus activity
          </a>
        </div>
      </Section>
    </>
  );
}

export function BonusRow({ log }: { log: WorkoutLog }) {
  return (
    <a class="row" href={`#/log/bonus/${log.id}`}>
      <span class="row-icon">
        <Icon name={log.kind} size={20} />
      </span>
      <span class="row-main">
        <span class="row-title">
          {kindLabel[log.kind]} · {formatDay(log.date)}
        </span>
        <span class="row-sub num">{logSummary(log) || 'Logged'}</span>
      </span>
      <Icon name="chevron" size={18} />
    </a>
  );
}
