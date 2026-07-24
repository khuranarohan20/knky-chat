import React, { useEffect, useMemo, useState } from 'react';

import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useChatConfig } from '../../hooks/useChatConfig';
import { useActiveChannelId, useChatList, useTargetPerson } from '../../store/chatStore';
import { isActiveBuyer } from '../../lib/chatFee';

export interface SubscriptionPromptProps {
  creatorId?: string;
  /** Logged-in (buyer) user id. */
  selfId?: string;
}

type FeeService = { is_active?: boolean; chat_fee_type?: string; price?: number; [k: string]: any };

/** Fee-type → CTA phrase (ported from knky-frontend's SubscriptionPrompt). */
function feeCta(type: string | undefined): { text: string; suffix?: string } {
  switch (type) {
    case 'OneOff':
      return { text: 'unlock lifetime access' };
    case 'Week':
      return { text: 'unlock access', suffix: ' for 7d' };
    case 'Month':
      return { text: 'unlock access', suffix: ' for 30d' };
    case 'PerMessage':
      return { text: 'buy', suffix: ' a message pack' };
    default:
      return { text: 'unlock access' };
  }
}

/**
 * Locked-chat prompt — ported from knky-frontend's SubscriptionPrompt. Shown
 * when the fan can't chat for free: a "restricted … Subscribe or unlock access
 * to start chatting" card whose CTAs open the host's fee/subscription modals.
 * Renders nothing when chat is already accessible (buyer / free / has messages).
 */
export function SubscriptionPrompt({ creatorId, selfId }: SubscriptionPromptProps): React.ReactElement | null {
  const id = useResolvedCreatorId(creatorId);
  const { getChatServices, openModal } = useChatConfig();
  const chatList = useChatList(id);
  const channelId = useActiveChannelId(id);
  const targetPerson = useTargetPerson(id);
  const targetUser = targetPerson?._id;
  const targetName = targetPerson?.display_name || '';

  const chat = useMemo(() => chatList.find((c) => c.converse_channel_id === channelId), [chatList, channelId]);

  const [fees, setFees] = useState<FeeService[] | null>(null);

  // Local access checks first (no fetch needed when clearly accessible).
  const { accessible, hasSubscription } = useMemo(() => {
    const consumables = chat?.converse_consumable || [];
    const messagesLeft = consumables.find((c) => c.buyer === selfId)?.available_message ?? 0;
    const isBuyer = (chat?.buyers || []).some((b) => (b.buyer === selfId || b.buyer === targetUser) && isActiveBuyer(b));
    const perks = chat?.free_perks;
    const perksActive = !!(perks && new Date(perks.expires_on) > new Date());
    const other = chat && (chat.target?._id === targetUser ? chat.target : chat.initiator);
    const isUser = (other as any)?.user_type === 'USER';
    const hasSub = !!(other as any)?.min_subscription && Object.keys((other as any).min_subscription).length > 0;
    return { accessible: isUser || messagesLeft > 0 || isBuyer || perksActive, hasSubscription: hasSub };
  }, [chat, selfId, targetUser]);

  useEffect(() => {
    if (accessible || !targetUser || !getChatServices) {
      setFees(null);
      return;
    }
    let cancelled = false;
    getChatServices({ userId: targetUser })
      .then((res) => {
        if (!cancelled) setFees(res || []);
      })
      .catch(() => {
        if (!cancelled) setFees([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessible, targetUser, getChatServices]);

  if (accessible || fees === null) return null;

  const activeFees = fees.filter((f) => f.is_active && f.chat_fee_type !== 'Free');
  const hasFreeService = fees.some((f) => f.is_active && f.chat_fee_type === 'Free');
  if (hasFreeService) return null; // free chat → not restricted

  const nonFreeTypes = new Set(activeFees.map((f) => f.chat_fee_type));
  const mixed = nonFreeTypes.size > 1;
  const lowest = [...activeFees].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  const primaryFeeType = lowest?.chat_fee_type;

  if (activeFees.length === 0 && !hasSubscription) {
    return (
      <div className="flex justify-center p-3">
        <div className="max-w-[20rem] rounded border bg-white p-3 text-[0.9rem]">This creator has disabled public chat</div>
      </div>
    );
  }

  const cta = feeCta(primaryFeeType);
  const restrictedText = primaryFeeType === 'PerMessage' ? `Chat with ${targetName} is restricted.` : `Chat with ${targetName} is restricted to subscribed fans.`;

  const subscribeLink = hasSubscription ? (
    <span className="cursor-pointer text-[#ac1991] underline" onClick={() => openModal?.('SUBSCRIBE', { creatorId: targetUser })}>
      Subscribe
    </span>
  ) : null;

  const feeAction = activeFees.length ? (
    mixed ? (
      <span className="cursor-pointer text-[#ac1991] underline" onClick={() => openModal?.('SHOW_SERVICES', { targetUserId: targetUser, channelId, filter: { type: 'CHAT-FEE' }, entity: 'CHAT' })}>
        see options
      </span>
    ) : (
      <>
        <span className="cursor-pointer text-[#ac1991] underline" onClick={() => openModal?.('SHOW_SERVICES', { targetUserId: targetUser, channelId, filter: { type: 'CHAT-FEE' }, entity: 'CHAT' })}>
          {cta.text}
        </span>
        {cta.suffix ?? ''}
      </>
    )
  ) : null;

  return (
    <div className="flex justify-end p-3">
      <div className="max-w-[20rem] rounded border bg-white p-3 text-[0.9rem]">
        {restrictedText} {subscribeLink}
        {subscribeLink && feeAction ? ' or ' : ''}
        {feeAction}
        {' to start chatting.'}
      </div>
    </div>
  );
}
