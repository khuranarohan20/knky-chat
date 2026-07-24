import React from 'react';
import { LockIcon } from 'lucide-react';

import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/format';
import { SvgIcon } from '../../../common/SvgIcon';

export const StatusBadge = ({ isUnlocked, absoluteRequired = true }: { isUnlocked: boolean; absoluteRequired?: boolean }): React.ReactElement => (
  <div
    className={cn('m-1 flex items-center gap-1 whitespace-nowrap rounded p-1 text-xs right-0 top-0', absoluteRequired && 'absolute')}
    style={{
      border: `1px solid ${isUnlocked ? '#31A9FF' : '#F1AD00'}`,
      fontWeight: 500,
      color: isUnlocked ? '#31A9FF' : '#F1AD00',
      backdropFilter: 'blur(16px)',
      background: isUnlocked ? '#31A9FF14' : '#F1AD0014',
    }}
  >
    {isUnlocked ? 'Fan Paid' : 'Waiting'}
  </div>
);

export const PriceBadge = ({ price, isOwner, isUnlocked }: { price: number; isOwner: boolean; isUnlocked: boolean }): React.ReactElement => (
  <div className="absolute bottom-0 left-0 m-1 flex items-center gap-1 rounded p-1 text-xs text-white" style={{ backdropFilter: 'blur(16px)', background: 'rgba(0, 0, 0, 0.2)' }}>
    {!isOwner && isUnlocked ? 'Paid ' : ''}
    {formatCurrency(price)}
  </div>
);

export const VideoOverlay = ({ isLocked }: { isLocked: boolean }): React.ReactElement => (
  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
    {isLocked ? <LockIcon color="white" /> : null}
    <SvgIcon src="/svg/video-play.svg" size={60} alt="play" />
  </div>
);

export const BottomRightBadge = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div className="absolute bottom-0 right-0 m-1 flex items-center gap-1 rounded p-1 text-xs text-white" style={{ backdropFilter: 'blur(16px)', background: 'rgba(0, 0, 0, 0.2)' }}>
    {children}
  </div>
);

export const TopLeftBadge = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div className="absolute left-0 top-0 m-1 flex items-center gap-1 rounded p-1 text-xs text-white" style={{ backdropFilter: 'blur(16px)', background: 'rgba(0, 0, 0, 0.2)' }}>
    {children}
  </div>
);
