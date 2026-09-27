import type { ComponentChildren } from 'preact';
import type { SlotId } from './data/types.ts';
import { Icon, type IconName } from './components/Icon.tsx';
import { useRoute } from './router.ts';
import { useAppState } from './lib/store.ts';
import { slotIds, weekCount } from './lib/week.ts';
import { EditWorkout } from './screens/EditWorkout.tsx';
import { LogWorkout } from './screens/LogWorkout.tsx';
import { Plan } from './screens/Plan.tsx';
import { Progress } from './screens/Progress.tsx';
import { Settings } from './screens/Settings.tsx';
import { Today } from './screens/Today.tsx';
import { Workout } from './screens/Workout.tsx';

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

/** Validate "/:week/:slot" route params. */
function weekSlot(params: string[]): { week: number; slot: SlotId } | null {
  const week = Number(params[0]);
  const slot = params[1] as SlotId;
  if (!Number.isInteger(week) || week < 1 || week > weekCount() || !slotIds().includes(slot)) return null;
  return { week, slot };
}

export function App() {
  const state = useAppState();
  const [page = 'today', ...params] = useRoute();
  const ws = weekSlot(params);

  // Routes:
  //   #/today  #/plan  #/progress  #/settings
  //   #/workout/:week/:slot[/edit]
  //   #/log/:week/:slot  #/log/bonus[/:id]
  let screen: ComponentChildren = null;
  let tab = page;
  if (page === 'settings') {
    screen = <Settings state={state} />;
  } else if (page === 'progress') {
    screen = <Progress state={state} />;
  } else if (page === 'plan') {
    screen = <Plan state={state} />;
  } else if (page === 'workout' && ws && params[2] === 'edit') {
    tab = 'today';
    screen = <EditWorkout key={`${ws.week}-${ws.slot}`} state={state} {...ws} />;
  } else if (page === 'workout' && ws) {
    tab = 'today';
    screen = <Workout state={state} {...ws} />;
  } else if (page === 'log' && params[0] === 'bonus') {
    tab = 'today';
    screen = <LogWorkout key={params[1] ?? 'new'} state={state} week={null} slot={null} logId={params[1]} />;
  } else if (page === 'log' && ws) {
    tab = 'today';
    screen = <LogWorkout key={`${ws.week}-${ws.slot}`} state={state} {...ws} />;
  }
  if (!screen) {
    tab = 'today';
    screen = <Today state={state} />;
  }

  return (
    <div class="app">
      <main class="main">{screen}</main>
      <nav class="tabbar" aria-label="Main">
        {tabs.map((t) => (
          <a key={t.id} href={`#/${t.id}`} class={`tab ${tab === t.id ? 'is-active' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
