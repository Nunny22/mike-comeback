// Small stroke icons, 24×24. Inherit colour from currentColor.

const paths = {
  run: <path d="M5 6l6 6-6 6M13 6l6 6-6 6" />,
  weights: <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />,
  endurance: <path d="M3 19l6.5-11 4 6.5 2.5-3.5 5 8z" />,
  bike: (
    <>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l3.5-7h5.5l3 7M9.5 9L12 16H6M8 6h3" />
    </>
  ),
  hike: <path d="M3 19l6.5-11 4 6.5 2.5-3.5 5 8z" />,
  walk: (
    <>
      <circle cx="12" cy="5" r="1.8" />
      <path d="M12 8.5v6l-3 5.5M12 14.5l3 5.5M8.5 12l3.5-3.5 3.5 3" />
    </>
  ),
  other: <path d="M12 4v16M4 12h16" />,
  today: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plan: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  progress: <path d="M5 20v-7M12 20V5M19 20v-10" />,
  settings: (
    <>
      <path d="M4 7h9M19 7h1M4 17h3M11 17h9" />
      <circle cx="16" cy="7" r="2.5" />
      <circle cx="9" cy="17" r="2.5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
