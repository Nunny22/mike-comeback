import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './components/Icon.tsx';
import { useRoute } from './router.ts';
import { useAppState } from './lib/store.ts';
import { Today } from './screens/Today.tsx';

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function App() {
  const state = useAppState();
  const [page = 'today', ...params] = useRoute();

  let screen: ComponentChildren;
  let tab = page;
  switch (page) {
    default:
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

