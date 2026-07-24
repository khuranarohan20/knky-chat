import React from 'react';
import { format } from 'date-fns/format';

import { formatCurrency } from '../../../../lib/format';

const billingCycleMap: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12, ONE_TIME: 1 };
const validateAmount = (price: number) => Math.ceil(price * 100) / 100;

function subDate(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return isNaN(d.getTime()) ? '' : format(d, 'MMM dd, yyyy');
}

/** Subscribed-state summary — ported from the agency SubscriptionButton. */
export function SubscriptionButton({
  is_cancelled,
  planPrice,
  planExpiry,
  planType,
  className,
}: {
  is_cancelled?: boolean;
  planPrice?: number;
  planExpiry: string;
  planType?: string;
  className?: string;
}): React.ReactElement {
  const validity = planType ?? 'MONTHLY';
  const validityMap = billingCycleMap[validity] || 1;
  const perMonthAmount = validateAmount((planPrice ?? 0) / validityMap);
  return (
    <div className={className || 'w-full p-3 pt-0'}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <p className="m-0 font-semibold">{is_cancelled ? 'Unsubscribed' : 'Subscribed'}:</p>
          <p className="m-0 font-semibold">
            {(planPrice ?? 0) === 0 ? 'Free' : <>{formatCurrency(perMonthAmount)} {validity !== 'ONE_TIME' && '/ month'}</>}
          </p>
        </div>
        {validity !== 'ONE_TIME' ? (
          <p className="m-0 text-xs text-black">
            {is_cancelled ? 'Ends' : 'Auto-renew'} at: {subDate(planExpiry)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
