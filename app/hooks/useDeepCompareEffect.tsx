import isEqual from "lodash/isEqual";
import { useEffect, useRef } from "react";

export function useDeepCompareEffect(
  callback: React.EffectCallback,
  dependencies: any[]
): void {
  const previousDepsRef = useRef<any[]>(null);

  if (!isEqual(previousDepsRef.current, dependencies)) {
    previousDepsRef.current = dependencies;
  }

  useEffect(callback, [previousDepsRef.current]);
}
