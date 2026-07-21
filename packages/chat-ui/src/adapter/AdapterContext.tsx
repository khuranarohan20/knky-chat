import React, { createContext, useContext } from 'react';
import type { IPlatformAdapter } from './types';

const AdapterContext = createContext<IPlatformAdapter | null>(null);

export function AdapterProvider({
  adapter,
  children,
}: {
  adapter: IPlatformAdapter;
  children: React.ReactNode;
}) {
  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>;
}

export function useAdapter(): IPlatformAdapter {
  const ctx = useContext(AdapterContext);
  if (!ctx) {
    throw new Error('useAdapter must be used inside <ChatProvider>');
  }
  return ctx;
}

export function useOptionalAdapter(): IPlatformAdapter | null {
  return useContext(AdapterContext);
}
