// Tiny hash router: "#/workout/2/run" → ['workout', '2', 'run'].
// Hash routing works on any static host (GitHub Pages included) with no rewrites.

import { useEffect, useState } from 'preact/hooks';

const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function go(path: string) {
  location.hash = `#/${path.replace(/^\//, '')}`;
}

