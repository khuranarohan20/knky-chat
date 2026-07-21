import { useEffect, type DependencyList } from 'react';

export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps: DependencyList,
): void {
  useEffect(() => {
    let cleanup: void | (() => void);
    effect().then((c) => { cleanup = c; });
    return () => { if (typeof cleanup === 'function') cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
