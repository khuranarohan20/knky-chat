import React from 'react';

import { cn } from '../../lib/utils';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export interface AvatarProps {
  url?: string;
  name: string;
  className?: string;
}

/** Round avatar with an initials fallback when no image url is present. */
export function Avatar({ url, name, className }: AvatarProps): React.ReactElement {
  if (url) {
    return <img src={url} alt={name} className={cn('size-9 rounded-full object-cover', className)} />;
  }
  return (
    <div
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
