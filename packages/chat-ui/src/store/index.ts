// Chat UI Store exports
// Platform-agnostic store interfaces and utilities

import type { Chat, MessageInterface, ChatPerson } from '@knky-chat/core-chat';

/**
 * Base chat state interface (platform-agnostic)
 */
export interface BaseChatState {
  chatList: Chat[];
  activeChat: Chat | null;
  activeChannelId: string;
  targetPerson: ChatPerson | null;
  isLoading: boolean;
}

/**
 * Chat store interface
 */
export interface IChatStore {
  getState(): BaseChatState;
  dispatch(action: any): void;
  subscribe(listener: (state: BaseChatState) => void): () => void;
}

/**
 * Store action types
 */
export interface ChatActions {
  setChatList: (chatList: Chat[]) => void;
  setActiveChat: (chat: Chat) => void;
  setActiveChannelId: (id: string) => void;
  setTargetPerson: (person: ChatPerson) => void;
  setIsLoading: (isLoading: boolean) => void;
  addMessage: (message: MessageInterface) => void;
  updateMessage: (messageId: string, updates: Partial<MessageInterface>) => void;
  deleteMessage: (messageId: string) => void;
}
