import React, { useEffect, useRef, useState } from 'react';
import { AdapterProvider } from './adapter/AdapterContext';
import type { IPlatformAdapter } from './adapter/types';

interface ChatProviderProps {
  adapter: IPlatformAdapter;
  children: React.ReactNode;
  /** Called when initialization fails */
  onError?: (error: Error) => void;
  /** Rendered while initialization is in progress */
  loadingFallback?: React.ReactNode;
  /** Rendered if initialization fails and no onError handler resets state */
  errorFallback?: (error: Error, retry: () => void) => React.ReactNode;
}

type InitState = { status: 'idle' } | { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error };

/**
 * ChatProvider is the single entry point for host apps.
 *
 * It:
 *   1. Calls adapter.initialize() once on mount
 *   2. Wraps children in AdapterContext so hooks can reach the adapter
 *   3. Calls adapter.destroy() on unmount
 *   4. Exposes loading and error states with customisable fallbacks
 *
 * Usage:
 *   <ChatProvider adapter={new CoreAdapter(config)}>
 *     <ChatList />
 *     <ChatBox />
 *   </ChatProvider>
 */
export function ChatProvider({
  adapter,
  children,
  onError,
  loadingFallback = null,
  errorFallback,
}: ChatProviderProps) {
  const [state, setState] = useState<InitState>({ status: 'idle' });
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const initialize = () => {
    setState({ status: 'loading' });
    adapterRef.current
      .initialize()
      .then(() => setState({ status: 'ready' }))
      .catch((err: Error) => {
        setState({ status: 'error', error: err });
        onError?.(err);
      });
  };

  useEffect(() => {
    initialize();
    return () => {
      adapterRef.current.destroy();
    };
    // adapter identity change intentionally re-initializes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  if (state.status === 'idle' || state.status === 'loading') {
    return <>{loadingFallback}</>;
  }

  if (state.status === 'error') {
    if (errorFallback) return <>{errorFallback(state.error, initialize)}</>;
    return null;
  }

  return <AdapterProvider adapter={adapter}>{children}</AdapterProvider>;
}
