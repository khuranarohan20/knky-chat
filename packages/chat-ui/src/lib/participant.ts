import type { Chat, ChatPerson } from '@knky-chat/core-chat';

/**
 * The person to display for a chat = the participant that is NOT me.
 *
 * A chat has two participants (`target` + `initiator`); one is "me" (the active
 * creator, whose id is `selfId`), the other is the fan. Whichever side matches
 * my id, show the opposite. Matches the agency's ChatList/ChatPerson logic.
 */
export function otherParticipant(chat: Chat, selfId: string): ChatPerson | undefined {
  if (chat?.target?._id === selfId) return chat.initiator;
  if (chat?.initiator?._id === selfId) return chat.target;
  // selfId matches neither (e.g. core sentinel) — default to target.
  return chat?.target;
}
