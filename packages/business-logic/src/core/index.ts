// Core Platform Business Logic
// Single creator, flat state structure

import type { Chat, MessageInterface, ChatPerson } from '@knky-chat/core-chat';

/**
 * Core platform state interface (flat structure)
 */
export interface CoreChatState {
  chatList: Chat[];
  activeChat: Chat | null;
  activeChannelId: string;
  targetPerson: ChatPerson | null;
  converseToken: string;
  isLoading: boolean;
  userDetails: {
    _id: string;
    token: string;
  };
  firstItemIndex: number;
}

/**
 * Core platform state setters interface
 */
export interface CoreChatStateSetters {
  setChatList: (chatList: Chat[]) => void;
  setActiveChat: (chat: Chat) => void;
  setActiveChannelId: (id: string) => void;
  setTargetPerson: (person: ChatPerson) => void;
  setConverseToken: (token: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setUserDetails: (details: { _id: string; token: string }) => void;
  setFirstItemIndex: (index: number) => void;
}

/**
 * Core platform state manager interface
 * Platforms can implement this with their preferred state management (Zustand, Redux, etc.)
 */
export interface ICoreChatStateManager {
  getState(): CoreChatState;
  setState<K extends keyof CoreChatState>(key: K, value: CoreChatState[K]): void;
  subscribe(listener: (state: CoreChatState) => void): () => void;
}

/**
 * Core platform business logic manager
 */
export class CoreChatManager {
  constructor(private stateManager: ICoreChatStateManager) {}

  /**
   * Get current state
   */
  getState(): CoreChatState {
    return this.stateManager.getState();
  }

  /**
   * Update chat list
   */
  updateChatList(chatList: Chat[]): void {
    this.stateManager.setState('chatList', chatList);
  }

  /**
   * Set active chat
   */
  setActiveChat(chat: Chat): void {
    this.stateManager.setState('activeChat', {
      ...chat,
      unread_count: 0, // Reset unread count when opening chat
    });
  }

  /**
   * Set active channel ID
   */
  setActiveChannelId(channelId: string): void {
    this.stateManager.setState('activeChannelId', channelId);
  }

  /**
   * Set target person
   */
  setTargetPerson(person: ChatPerson | null): void {
    this.stateManager.setState('targetPerson', person);
  }

  /**
   * Set converse token
   */
  setConverseToken(token: string): void {
    this.stateManager.setState('converseToken', token);
  }

  /**
   * Set loading state
   */
  setIsLoading(isLoading: boolean): void {
    this.stateManager.setState('isLoading', isLoading);
  }

  /**
   * Set user details
   */
  setUserDetails(details: { _id: string; token: string }): void {
    const currentDetails = this.getState().userDetails;
    this.stateManager.setState('userDetails', {
      ...currentDetails,
      ...details,
    });
  }

  /**
   * Set first item index (for pagination)
   */
  setFirstItemIndex(index: number): void {
    this.stateManager.setState('firstItemIndex', index);
  }

  /**
   * Add message to active chat
   */
  addMessage(message: MessageInterface, channelId: string): void {
    const currentChatList = this.getState().chatList;
    const activeChat = this.getState().activeChat;
    const activeChannelId = this.getState().activeChannelId;

    const updatedChatList = currentChatList.map(chat => {
      if (chat.converse_channel_id === channelId) {
        const existingMessages = chat.complete_messages || [];
        const messageMap = new Map(
          existingMessages.map(msg => [msg._id, msg])
        );
        messageMap.set(message._id, message);
        const newMessages = Array.from(messageMap.values());

        return {
          ...chat,
          message: message, // Update last message
          complete_messages: newMessages,
          unread_count: chat.unread_count + 1,
        };
      }
      return chat;
    });

    // Sort chats by last message
    const sortedChatList = updatedChatList.sort((a, b) => {
      const aTime = this.getMessageDate(a);
      const bTime = this.getMessageDate(b);
      return bTime - aTime;
    });

    this.stateManager.setState('chatList', sortedChatList);
    this.stateManager.setState('activeChat', sortedChatList.find(
      chat => chat.converse_channel_id === activeChannelId
    ));
  }

  /**
   * Set complete messages for a chat
   */
  setCompleteMessages(messages: MessageInterface[]): void {
    const currentChat = this.getState().activeChat;
    if (!currentChat) return;

    this.stateManager.setState('activeChat', {
      ...currentChat,
      complete_messages: messages,
    });

    // Update chat list with new messages
    const currentChatList = this.getState().chatList;
    const updatedChatList = currentChatList.map(chat =>
      chat._id === currentChat._id
        ? { ...chat, complete_messages: messages }
        : chat
    );

    this.stateManager.setState('chatList', updatedChatList);
  }

  /**
   * Helper to get message timestamp from chat
   */
  private getMessageDate(chat: Chat): number {
    const msg = chat.message;
    if (!msg) return 0;

    if (typeof msg === 'string') {
      return 0;
    }

    return new Date(msg.createdAt).getTime();
  }
}

/**
 * Factory function to create core chat manager
 */
export function createCoreChatManager(
  stateManager: ICoreChatStateManager
): CoreChatManager {
  return new CoreChatManager(stateManager);
}
