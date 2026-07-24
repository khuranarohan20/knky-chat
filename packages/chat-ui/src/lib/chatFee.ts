import type { BuyerInterface, Chat } from '@knky-chat/core-chat';

/**
 * Chat-fee gating — ported from knky-frontend's isChatEnabled.ts. Pure logic
 * over a Chat + the logged-in user, with the remote service lookup provided by
 * the host (services.getChatServices) instead of reading Redux directly.
 */

/** A buyers[] entry grants access only while live: OneOff never expires; else expires_at must be future. */
export function isActiveBuyer(b: Partial<BuyerInterface> | null | undefined): boolean {
  if (!b) return false;
  if (b.service_id?.chat_fee_type === 'OneOff') return true;
  const expires = new Date(b.expires_at || 0).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export interface ChatServiceStatus {
  enabled: boolean;
  isBuyer: boolean;
  messagesLeft: number;
  perksActive: boolean;
  hasFreeChat: boolean;
}

type FeeService = { is_active?: boolean; chat_fee_type?: string; [k: string]: any };

/** Which participant is the target — to read their user_type / services. */
function targetKey(chat: Chat, targetUser: string): 'target' | 'initiator' {
  return chat.target?._id === targetUser ? 'target' : 'initiator';
}

/**
 * Decide whether the current user can chat with the target for free, or must
 * pay/subscribe. `getChatServices` is the host's GetServiceList (CHAT-FEE).
 */
export async function getChatServiceStatus(opts: {
  chat: Chat | null | undefined;
  currentUserId: string;
  targetUser: string;
  getChatServices?: (input: { userId: string; role?: string }) => Promise<FeeService[]>;
  role?: string;
}): Promise<ChatServiceStatus> {
  const { chat, currentUserId, targetUser, getChatServices, role } = opts;
  const none: ChatServiceStatus = { enabled: false, isBuyer: false, messagesLeft: 0, perksActive: false, hasFreeChat: false };
  if (!chat) return none;

  const consumables = chat.converse_consumable || [];
  const messagesLeft = consumables.find((c) => c.buyer === currentUserId)?.available_message || 0;

  const buyDetails = (chat.buyers || []).filter((b) => (b.buyer === currentUserId || b.buyer === targetUser) && isActiveBuyer(b));
  const isBuyer = buyDetails.length > 0;

  const perks = chat.free_perks;
  const perksActive = !!(perks && new Date(perks.expires_on) > new Date());

  // Chatting with a plain USER (not a creator) is always free.
  const other = chat[targetKey(chat, targetUser)] as any;
  if (other?.user_type === 'USER') return { enabled: true, isBuyer, messagesLeft, perksActive, hasFreeChat: true };

  if (messagesLeft > 0 || isBuyer || perksActive) return { enabled: true, isBuyer, messagesLeft, perksActive, hasFreeChat: true };

  if (!getChatServices) return { ...none, isBuyer, messagesLeft, perksActive };
  try {
    const services = (await getChatServices({ userId: targetUser, role })) || [];
    const active = services.filter((s) => s?.is_active);
    const hasFreeChat = active.some((s) => s.chat_fee_type === 'Free' || s.chat_fee_type === 'FREE');
    return { enabled: hasFreeChat || perksActive, isBuyer, messagesLeft, perksActive, hasFreeChat };
  } catch {
    return { ...none, isBuyer, messagesLeft, perksActive };
  }
}
