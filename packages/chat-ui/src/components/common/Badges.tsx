import React, { memo } from 'react';

import type { BadgesType } from '@knky-chat/core-chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Ported from the agency common/badges: render the highest-priority user badge
// and subscription badge, each with a tooltip.
const badgeImages: Record<string, string> = {
  VerifiedUser: '/images/badges/user-verified.svg',
  VerifiedCreator: '/images/badges/creator-verified.svg',
  AffiliatedWithKnky: '/images/badges/affliated.svg',
  Prime: '/images/badges/knky-prime.svg',
  CreatorPro: '/images/badges/creator-verified-official.svg',
};
const userBadgeTooltip: Record<string, string> = {
  VerifiedUser: 'Verified User',
  VerifiedCreator: 'Verified Creator',
  AffiliatedWithKnky: 'Affiliated with Knky',
  Prime: 'Prime',
  CreatorPro: 'Creator Pro',
};
const FIRST_PRIORITY = ['CreatorPro', 'VerifiedCreator', 'VerifiedUser'];
const SECOND_PRIORITY = ['AffiliatedWithKnky', 'Prime'];

function BadgeImg({ badge }: { badge: string }): React.ReactElement {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <img className="user-badge" src={badgeImages[badge]} width={18} height={18} alt={userBadgeTooltip[badge]} />
        </TooltipTrigger>
        <TooltipContent>{userBadgeTooltip[badge]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function BadgesBase({ cls, array }: { cls?: string; array?: BadgesType }): React.ReactElement {
  const all = [...(array?.user_badges || []), ...(array?.subscription_badge || [])] as string[];
  const first = FIRST_PRIORITY.find((b) => all.includes(b));
  const second = SECOND_PRIORITY.find((b) => all.includes(b));
  return (
    <div className={`flex items-center gap-0.5 ${cls ?? ''}`}>
      {first ? <BadgeImg badge={first} /> : null}
      {second ? <BadgeImg badge={second} /> : null}
    </div>
  );
}

export const Badges = memo(BadgesBase);
export default Badges;
