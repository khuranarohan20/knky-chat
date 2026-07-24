import React from 'react';
import { format } from 'date-fns/format';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import { parseISO } from 'date-fns/parseISO';

import { cn } from '../../lib/utils';

/** Ported verbatim from the agency DateFormatter. */
export default function DateFormatter({
  dateString,
  formatType = 'dd/MM/yy hh:mm',
  isMessage = true,
  className,
}: {
  dateString: string;
  formatType?: string;
  isMessage?: boolean;
  className?: string;
}): React.ReactElement | string | null {
  if (!dateString) return null;

  const date = parseISO(dateString);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Invalid date string passed to DateFormatter:', dateString);
    return 'Invalid Date';
  }

  if (!isMessage && isYesterday(date)) {
    return (
      <time dateTime={dateString} className={cn(className)}>
        Yesterday
      </time>
    );
  }
  if (!isMessage && isToday(date)) {
    return (
      <time dateTime={dateString} className={cn(className)}>
        Today
      </time>
    );
  }

  return (
    <div className={cn(className)}>
      <time dateTime={dateString}>{format(date, formatType)}</time>
    </div>
  );
}
