import type { ComponentChildren } from 'preact';
import { Icon } from './Icon.tsx';
import { go } from '../router.ts';

/** Header for sub-screens (workout, log, edit) with a back button. */
export function SubHeader({ title, backTo, eyebrow }: { title: string; backTo: string; eyebrow?: string }) {
  return (
    <header class="subheader">
      <button class="icon-btn" onClick={() => go(backTo)} aria-label="Back">
        <Icon name="back" />
      </button>
      <div>
        {eyebrow && <p class="eyebrow">{eyebrow}</p>}
        <h1 class="subheader-title">{title}</h1>
      </div>
    </header>
  );
}

export function Section({ title, children, action }: { title?: string; children: ComponentChildren; action?: ComponentChildren }) {
  return (
    <section class="section">
      {(title || action) && (
        <div class="section-head">
          {title && <h2 class="section-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
