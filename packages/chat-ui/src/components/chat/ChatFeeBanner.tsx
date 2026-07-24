import React, { useMemo } from 'react';

import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useActiveChannelId, useChatList, useTargetPerson } from '../../store/chatStore';
import { isActiveBuyer } from '../../lib/chatFee';

export interface ChatFeeBannerProps {
  creatorId?: string;
  /** The logged-in (buyer) user id. */
  selfId?: string;
}

/**
 * Chat-fee status strip above the composer — ported from knky-frontend's
 * ChatFeeBanner: shows access time-left for a buyer, or remaining pre-paid
 * messages; renders nothing when chat is free (perks) or fully gated (the
 * composer opens the fee modal on send in that case).
 */
export function ChatFeeBanner({ creatorId, selfId }: ChatFeeBannerProps): React.ReactElement | null {
  const id = useResolvedCreatorId(creatorId);
  const chatList = useChatList(id);
  const channelId = useActiveChannelId(id);
  const targetPerson = useTargetPerson(id);
  const targetUser = targetPerson?._id;

  const chat = useMemo(() => chatList.find((c) => c.converse_channel_id === channelId), [chatList, channelId]);

  const { buyDetails, messagesLeft, freePerksActive } = useMemo(() => {
    const consumables = chat?.converse_consumable || [];
    const mLeft = consumables.find((c) => c.buyer === selfId)?.available_message ?? 0;
    const buys = (chat?.buyers || []).filter((b) => (b.buyer === selfId || b.buyer === targetUser) && isActiveBuyer(b));
    const perks = chat?.free_perks;
    const perksActive = !!(perks && new Date(perks.expires_on) > new Date());
    return { buyDetails: buys, messagesLeft: mLeft, freePerksActive: perksActive };
  }, [chat, selfId, targetUser]);

  if (freePerksActive) return null;

  if (buyDetails.length > 0) {
    // Earliest-expiring active purchase drives the "access until" label.
    const soonest = buyDetails
      .map((b) => new Date(b.expires_at).getTime())
      .filter((t) => Number.isFinite(t) && t > 0)
      .sort((a, b) => a - b)[0];
    const isOneOff = buyDetails.some((b) => b.service_id?.chat_fee_type === 'OneOff');
    return (
      <div className="flex justify-between border-t bg-[#f9f4f8] p-2 text-[0.9rem] text-[#ac1991]">
        {isOneOff || !soonest ? 'Chat access active' : `Chat access until ${new Date(soonest).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}`}
      </div>
    );
  }

  if (messagesLeft > 0) {
    return (
      <div className="flex justify-between border-t bg-[#f7f7fc] p-2 text-[0.9rem] text-[#4d5053]">
        You have {messagesLeft} message{messagesLeft > 1 ? 's' : ''} left.
      </div>
    );
  }

  return null;
}
