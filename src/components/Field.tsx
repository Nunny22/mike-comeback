import type { ComponentChildren } from 'preact';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ComponentChildren }) {
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      {children}
      {hint && <span class="field-hint">{hint}</span>}
    </label>
  );
}

/** Row of big toggle buttons. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label = (o: T) => String(o),
  class: cls = 'segmented',
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T) => void;
  label?: (o: T) => string;
  class?: string;
}) {
  return (
    <div class={cls} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={String(o)}
          role="radio"
          aria-checked={value === o}
          class={`seg ${value === o ? 'is-on' : ''}`}
          onClick={() => onChange(o)}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}
