import type { AppState } from '../data/types.ts';
import { programme } from '../data/programme.ts';
import { Field, Segmented } from '../components/Field.tsx';
import { Section } from '../components/Screen.tsx';
import { addDays, formatDay, mondayOf, todayISO } from '../lib/dates.ts';
import { exportState, importState, resetAll, setStartDate } from '../lib/store.ts';
import { currentWeek, weekCount } from '../lib/week.ts';

export function Settings({ state }: { state: AppState }) {
  const today = todayISO();
  const week = currentWeek(state.settings.startDate, today);
  const weeks = Array.from({ length: weekCount() }, (_, i) => i + 1);

  /** Make `w` the current week by moving the start date. Logged sessions stay attached to their week. */
  function jumpTo(w: number) {
    setStartDate(addDays(mondayOf(today), -(w - 1) * 7));
  }

  function download() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mike-comeback-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function restore(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!confirm('Replace everything on this device with this backup?')) return;
    try {
      importState(await file.text());
      alert('Backup restored.');
    } catch {
      alert('That file does not look like a Mike Comeback backup.');
    }
  }

  function wipe() {
    if (confirm('Delete all logs, check-ins and workout edits on this device?') && confirm('Really? This cannot be undone.')) {
      resetAll();
    }
  }

  return (
    <>
      <header class="hero">
        <h1 class="page-title">Settings</h1>
      </header>

      <Section title="Programme">
        <div class="panel form">
          <p class="muted small">
            {programme.name} · {programme.target} sessions a week. Week 1 {state.settings.startDate > today ? 'starts' : 'started'} {formatDay(state.settings.startDate)}.
          </p>
          <Field label="This week is…" hint="Missed some time? Move to whichever week fits. No penalty — your logs stay put.">
            <div style={`--weeks:${weeks.length}`}>
              <Segmented class="week-picker" options={weeks} value={week} onChange={jumpTo} label={(w) => `W${w}`} />
            </div>
          </Field>
          <Field label="Week 1 start date">
            <input
              class="input"
              type="date"
              value={state.settings.startDate}
              onChange={(e) => e.currentTarget.value && setStartDate(mondayOf(e.currentTarget.value))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Your data">
        <div class="panel stack">
          <p class="muted small">
            Everything is stored on this device only. Download a backup now and then — especially before clearing your browser or changing phone.
          </p>
          <button class="btn secondary block" onClick={download}>
            Download backup
          </button>
          <label class="btn secondary block">
            Restore from backup
            <input type="file" accept="application/json,.json" hidden onChange={restore} />
          </label>
          <button class="btn danger block" onClick={wipe}>
            Delete all data
          </button>
        </div>
      </Section>

      <Section title="Install">
        <div class="panel">
          <p class="small">
            <strong>iPhone:</strong> open in Safari → Share → Add to Home Screen.
            <br />
            <strong>Android:</strong> Chrome menu → Install app.
          </p>
        </div>
      </Section>

      <Section title="About">
        <p class="muted small">
          Three planned sessions a week is a win. Everything else is a bonus. The plan lives in <code>src/data/programme.ts</code>.
        </p>
      </Section>
    </>
  );
}
