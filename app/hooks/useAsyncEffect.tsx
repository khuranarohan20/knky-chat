import { type DependencyList, useEffect } from "react";

/**
 * useAsyncEffect allows you to handle async logic within a React effect.
 * @param effect - An async function to run inside the effect. It can return a cleanup function or a promise resolving to a cleanup function.
 * @param dependencies - Dependency array for the effect (same as useEffect).
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void | Promise<void>)>,
  dependencies: DependencyList
): void {
  useEffect(() => {
    const cleanupPromise = effect(); // Call the async effect

    return () => {
      if (typeof cleanupPromise?.then === "function") {
        cleanupPromise.then((cleanup) => {
          if (typeof cleanup === "function") {
            cleanup();
          }
        });
      } else if (typeof cleanupPromise === "function") {
        //@ts-expect-error cleanupPromise is a function
        cleanupPromise();
      }
    };
  }, dependencies);
}
