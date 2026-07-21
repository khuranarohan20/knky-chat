import { useEffect, useRef, type DependencyList } from 'react';

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDeepCompareEffect(
  effect: () => void | (() => void),
  deps: DependencyList,
): void {
  const ref = useRef<DependencyList | undefined>(undefined);

  if (!ref.current || !deepEqual(ref.current, deps)) {
    ref.current = deps;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, ref.current);
}
