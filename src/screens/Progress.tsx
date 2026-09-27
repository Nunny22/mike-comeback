import { useState } from 'preact/hooks';
import type { AppState, WorkoutLog } from '../data/types.ts';
import { Field } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { Section } from '../components/Screen.tsx';
import { Sparkline } from '../components/Sparkline.tsx';
import { formatShortDate, todayISO } from '../lib/dates.ts';
import { formatClock, formatPace, formatSpeed, num, speedKmh } from '../lib/format.ts';
import { deleteBody, saveBody } from '../lib/store.ts';
import { currentWeek, slotIds, weekCount, weekSummary } from '../lib/week.ts';

const byDate = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);
const hasPace = (l: WorkoutLog) => Boolean(l.durationMin && l.distanceKm);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const km = (n: number) => `${Number(n.toFixed(1))}`;

export function Progress({ state }: { state: AppState }) {
  const logs = [...state.logs].sort(byDate);
  const runs = logs.filter((l) => l.kind === 'run');
  const rides = logs.filter((l) => l.kind === 'bike');

  return (
    <>
      <header class="hero">
        <h1 class="page-title">Progress</h1>
        <p class="lede">Turning up is the main metric.</p>
      </header>

      <Consistency state={state} />

      <Section title="Running">
        {runs.length === 0 ? (
          <p class="empty">Log a run to see distance and pace here.</p>
        ) : (
          <div class="panel" style="--c: var(--run)">
            <div class="stats">
              <Stat value={String(runs.length)} label="Runs" />
              <Stat value={km(sum(runs.map((r) => r.distanceKm ?? 0)))} label="Total km" />
              <Stat value={formatPace(last(runs.filter(hasPace))?.durationMin, last(runs.filter(hasPace))?.distanceKm)?.replace(' /km', '') ?? '–'} label="Latest pace /km" />
            </div>
            <Sparkline values={runs.filter(hasPace).map((r) => r.durationMin! / r.distanceKm!)} invert label="Pace trend, higher is faster" />
            <History
              rows={runs.slice(-4).reverse().map((r) => [
                formatShortDate(r.date),
                [r.distanceKm && `${km(r.distanceKm)} km`, r.durationMin && formatClock(r.durationMin), formatPace(r.durationMin, r.distanceKm)].filter(Boolean).join(' · ') || '—',
              ])}
            />
          </div>
        )}
      </Section>

      <Section title="Cycling">
        {rides.length === 0 ? (
          <p class="empty">Log a ride to see distance and speed here.</p>
        ) : (
          <div class="panel" style="--c: var(--endurance)">
            <div class="stats">
              <Stat value={String(rides.length)} label="Rides" />
              <Stat value={km(sum(rides.map((r) => r.distanceKm ?? 0)))} label="Total km" />
              <Stat value={speedKmh(last(rides.filter(hasPace))?.durationMin, last(rides.filter(hasPace))?.distanceKm)?.toFixed(1) ?? '–'} label="Latest km/h" />
            </div>
            <Sparkline values={rides.filter(hasPace).map((r) => speedKmh(r.durationMin, r.distanceKm)!)} label="Speed trend" />
            <History
              rows={rides.slice(-4).reverse().map((r) => [
                formatShortDate(r.date),
                [r.distanceKm && `${km(r.distanceKm)} km`, r.durationMin && formatClock(r.durationMin), formatSpeed(r.durationMin, r.distanceKm)].filter(Boolean).join(' · ') || '—',
              ])}
            />
          </div>
        )}
      </Section>

      <Weights logs={logs} />
      <Body state={state} />
    </>
  );
}

function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p class="stat-value">{value}</p>
      <p class="stat-label">{label}</p>
    </div>
  );
}

function History({ rows }: { rows: [string, string][] }) {
  return (
    <div class="history num">
      {rows.map(([a, b], i) => (
        <div key={i}>
          <span class="muted">{a}</span>
          <span>{b}</span>
        </div>
      ))}
    </div>
  );
}

function Consistency({ state }: { state: AppState }) {
  const now = currentWeek(state.settings.startDate, todayISO());
  const weeks = Array.from({ length: weekCount() }, (_, i) => weekSummary(state, i + 1));
  const hit = weeks.filter((w) => w.complete).length;
  const sessions = sum(weeks.map((w) => w.count));
  const bonus = state.logs.filter((l) => l.slot === null).length;

  return (
    <Section title="Consistency">
      <div class="panel">
        <div class="consistency" style={`--weeks:${weeks.length}`}>
          {weeks.map((w) => (
            <div key={w.week} class={`col ${w.week === now ? 'is-current' : ''}`}>
              <div class="blocks" aria-label={`Week ${w.week}: ${w.count} of ${w.target}`}>
                {slotIds()
                  .map((_, i) => i < w.count)
                  .reverse()
                  .map((on, i) => (
                    <span key={i} class={on ? 'on' : ''} />
                  ))}
              </div>
              <span class="wk">W{w.week}</span>
            </div>
          ))}
        </div>
        <div class="stats" style="margin-top:18px">
          <Stat value={`${hit}`} label="Full weeks" />
          <Stat value={`${sessions}`} label="Planned done" />
          <Stat value={`${bonus}`} label="Bonus" />
        </div>
      </div>
    </Section>
  );
}

function Weights({ logs }: { logs: WorkoutLog[] }) {
  // For each exercise: first and latest logged weight.
  const lifts = new Map<string, { name: string; first: number; latest: number; date: string }>();
  for (const l of logs) {
    for (const e of l.exercises ?? []) {
      if (!e.weightKg) continue;
      const key = e.name.toLowerCase();
      const cur = lifts.get(key);
      lifts.set(key, { name: e.name, first: cur?.first ?? e.weightKg, latest: e.weightKg, date: l.date });
    }
  }
  const sessions = logs.filter((l) => l.kind === 'weights').length;

  return (
    <Section title="Weights">
      {lifts.size === 0 ? (
        <p class="empty">Log weights for your exercises to track them here.</p>
      ) : (
        <div class="panel">
          <p class="muted small">
            {sessions} session{sessions === 1 ? '' : 's'} · latest weight and change since your first log
          </p>
          <div class="history num">
            {[...lifts.values()].map((l) => {
              const diff = l.latest - l.first;
              return (
                <div key={l.name}>
                  <span>{l.name}</span>
                  <span>
                    {l.latest} kg{' '}
                    {diff !== 0 && <span class={`lift-change ${diff > 0 ? 'up' : ''}`}>{`${diff > 0 ? '+' : ''}${Number(diff.toFixed(1))}`}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

function Body({ state }: { state: AppState }) {
  const checks = [...state.body].sort(byDate);
  const weights = checks.filter((c) => c.weightKg);
  const hrs = checks.filter((c) => c.restingHr);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState('');
  const [hr, setHr] = useState('');

  function save(e: Event) {
    e.preventDefault();
    const weightKg = num(kg);
    const restingHr = num(hr);
    if (weightKg === undefined && restingHr === undefined) return;
    const existing = state.body.find((b) => b.date === date);
    saveBody({ date, weightKg: weightKg ?? existing?.weightKg, restingHr: restingHr ?? existing?.restingHr });
    setKg('');
    setHr('');
    setAdding(false);
  }

  /** "-1.5 since 3 Oct" — change from the first to the latest reading. */
  const change = (xs: { date: string; v: number }[]) => {
    if (xs.length < 2) return undefined;
    const d = xs[xs.length - 1].v - xs[0].v;
    return `${d > 0 ? '+' : ''}${Number(d.toFixed(1))} since ${formatShortDate(xs[0].date)}`;
  };

  return (
    <Section
      title="Body"
      action={
        !adding && (
          <button class="btn ghost small" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} /> Check-in
          </button>
        )
      }
    >
      {adding && (
        <form class="panel form" onSubmit={save} style="margin-bottom:12px">
          <Field label="Date">
            <input class="input" type="date" value={date} max={todayISO()} onInput={(e) => setDate(e.currentTarget.value)} />
          </Field>
          <div class="grid-2">
            <Field label="Bodyweight (kg)">
              <input class="input num" inputMode="decimal" value={kg} onInput={(e) => setKg(e.currentTarget.value)} />
            </Field>
            <Field label="Resting HR">
              <input class="input num" inputMode="numeric" placeholder="bpm" value={hr} onInput={(e) => setHr(e.currentTarget.value)} />
            </Field>
          </div>
          <div class="grid-2">
            <button type="button" class="btn secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button class="btn" type="submit">
              Save
            </button>
          </div>
        </form>
      )}

      {checks.length === 0 && !adding ? (
        <p class="empty">Optional. Add a bodyweight or resting HR check-in now and then.</p>
      ) : (
        checks.length > 0 && (
          <div class="panel">
            <div class="grid-2">
              <div>
                <Stat value={weights.length ? `${last(weights)!.weightKg} kg` : '–'} label="Bodyweight" />
                <p class="stat-label">{change(weights.map((w) => ({ date: w.date, v: w.weightKg! }))) ?? ' '}</p>
              </div>
              <div>
                <Stat value={hrs.length ? `${last(hrs)!.restingHr} bpm` : '–'} label="Resting HR" />
                <p class="stat-label">{change(hrs.map((h) => ({ date: h.date, v: h.restingHr! }))) ?? ' '}</p>
              </div>
            </div>
            <div class="grid-2">
              <Sparkline values={weights.map((w) => w.weightKg!)} label="Bodyweight trend" />
              <Sparkline values={hrs.map((h) => h.restingHr!)} label="Resting HR trend" />
            </div>
            <div class="history num">
              {checks
                .slice(-3)
                .reverse()
                .map((c) => (
                  <div key={c.id}>
                    <span class="muted">{formatShortDate(c.date)}</span>
                    <span>
                      {[c.weightKg && `${c.weightKg} kg`, c.restingHr && `${c.restingHr} bpm`].filter(Boolean).join(' · ')}
                      <button class="link-btn" style="margin-left:10px;padding:0" aria-label="Delete check-in" onClick={() => confirm('Delete this check-in?') && deleteBody(c.id)}>
                        ×
                      </button>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )
      )}
    </Section>
  );
}
