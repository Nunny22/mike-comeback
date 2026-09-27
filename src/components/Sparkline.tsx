/** Minimal trend line. Values oldest → newest. `invert` flips it so lower values plot higher (e.g. pace). */
export function Sparkline({ values, invert = false, label }: { values: number[]; invert?: boolean; label: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const t = (v - min) / span;
    const y = 4 + (invert ? t : 1 - t) * 32;
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      <path d={`M${lx} ${ly}h0`} stroke="currentColor" stroke-width="9" stroke-linecap="round" vector-effect="non-scaling-stroke" />
    </svg>
  );
}
