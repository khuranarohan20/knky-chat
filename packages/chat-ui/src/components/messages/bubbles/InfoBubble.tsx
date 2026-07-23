import React from 'react';

export interface InfoBubbleProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  amount?: number | string;
  status?: string;
  children?: React.ReactNode;
}

/**
 * Shared compact layout for service / notice bubbles (calls, ratings, custom
 * requests, payments, unlocks, embeds, …): leading icon + title, optional
 * price, subtitle and status line.
 */
export function InfoBubble({ icon, title, subtitle, amount, status, children }: InfoBubbleProps): React.ReactElement {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0 opacity-80">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {amount != null && amount !== '' ? (
            <span className="text-xs font-semibold">${amount}</span>
          ) : null}
        </div>
        {subtitle ? <p className="break-words text-xs opacity-80">{subtitle}</p> : null}
        {status ? <p className="text-[11px] uppercase tracking-wide opacity-60">{status}</p> : null}
        {children}
      </div>
    </div>
  );
}
