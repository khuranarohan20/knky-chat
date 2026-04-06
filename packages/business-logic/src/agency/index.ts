// Agency Platform Business Logic
// Multi-creator support, nested state structure

import type { Chat, MessageInterface, ChatPerson } from '@knky-chat/core-chat';

/**
 * Agency platform state interface (nested structure with creator isolation)
 */
export interface AgencyChatState {
  currentCreatorId: string | null;
  chatDataByCreator: Record<string, CreatorChatData>;
}

/**
 * Creator-specific chat data
 */
export interface CreatorChatData {
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
 * Agency platform state setters interface
 */
export interface AgencyChatStateSetters {
  setCurrentCreatorId: (creatorId: string | null) => void;
  setChatDataForCreator: (
    creatorId: string,
    data: CreatorChatData
  ) => void;
  setChatList: (creatorId: string, chatList: Chat[]) => void;
  setActiveChat: (creatorId: string, chat: Chat) => void;
  setActiveChannelId: (creatorId: string, id: string) => void;
  setTargetPerson: (creatorId: string, person: ChatPerson) => void;
  setConverseToken: (creatorId: string, token: string) => void;
  setIsLoading: (creatorId: string, isLoading: boolean) => void;
  setUserDetails: (creatorId: string, details: { _id: string; token: string }) => void;
  setFirstItemIndex: (creatorId: string, index: number) => void;
}

/**
 * Agency platform state manager interface
 */
export interface IAgencyChatStateManager {
  getState(): AgencyChatState;
  setState<K extends keyof AgencyChatState>(
    key: K,
    value: AgencyChatState[K]
  ): void;
  subscribe(listener: (state: AgencyChatState) => void): () => void;
}

/**
 * Agency platform business logic manager
 */
export class AgencyChatManager {
  constructor(private stateManager: IAgencyChatStateManager) {}

  /**
   * Get current creator ID
   */
  getCurrentCreatorId(): string | null {
    return this.stateManager.getState().currentCreatorId;
  }

  /**
   * Get current state
   */
  getState(): AgencyChatState {
    return this.stateManager.getState();
  }

  /**
   * Get creator-specific data
   */
  getCreatorData(creatorId: string): CreatorChatData {
    const state = this.getState();
    return (
      state.chatDataByCreator[creatorId] || this.createEmptyCreatorData()
    );
  }

  /**
   * Set current creator ID
   */
  setCurrentCreatorId(creatorId: string | null): void {
    this.stateManager.setState('currentCreatorId', creatorId);
  }

  /**
   * Switch to different creator
   */
  async switchCreator(
    creatorId: string,
    onSwitch?: () => Promise<void>
  ): Promise<void> {
    // Disconnect current socket if needed
    if (onSwitch) {
      await onSwitch();
    }

    this.setCurrentCreatorId(creatorId);

    // Ensure creator data exists
    const state = this.getState();
    if (!state.chatDataByCreator[creatorId]) {
      this.setCreatorData(creatorId, this.createEmptyCreatorData());
    }
  }

  /**
   * Set creator-specific chat data
   */
  setCreatorData(creatorId: string, data: CreatorChatData): void {
    const state = this.getState();
    this.stateManager.setState('chatDataByCreator', {
      ...state.chatDataByCreator,
      [creatorId]: data,
    });
  }

  /**
   * Update chat list for specific creator
   */
  updateChatList(creatorId: string, chatList: Chat[]): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      chatList,
    });
  }

  /**
   * Set active chat for specific creator
   */
  setActiveChat(creatorId: string, chat: Chat): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      activeChat: {
        ...chat,
        unread_count: 0, // Reset unread count when opening chat
      },
    });
  }

  /**
   * Set active channel ID for specific creator
   */
  setActiveChannelId(creatorId: string, channelId: string): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      activeChannelId: channelId,
    });
  }

  /**
   * Set target person for specific creator
   */
  setTargetPerson(creatorId: string, person: ChatPerson | null): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      targetPerson: person,
    });
  }

  /**
   * Set converse token for specific creator
   */
  setConverseToken(creatorId: string, token: string): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      converseToken: token,
    });
  }

  /**
   * Set loading state for specific creator
   */
  setIsLoading(creatorId: string, isLoading: boolean): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      isLoading,
    });
  }

  /**
   * Set user details for specific creator
   */
  setUserDetails(
    creatorId: string,
    details: { _id: string; token: string }
  ): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      userDetails: {
        ...creatorData.userDetails,
        ...details,
      },
    });
  }

  /**
   * Set first item index for specific creator
   */
  setFirstItemIndex(creatorId: string, index: number): void {
    const creatorData = this.getCreatorData(creatorId);
    this.setCreatorData(creatorId, {
      ...creatorData,
      firstItemIndex: index,
    });
  }

  /**
   * Add message to active chat for specific creator
   */
  addMessage(creatorId: string, message: MessageInterface, channelId: string): void {
    const creatorData = this.getCreatorData(creatorId);
    const currentChatList = creatorData.chatList;
    const activeChat = creatorData.activeChat;
    const activeChannelId = creatorData.activeChannelId;

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

    this.setCreatorData(creatorId, {
      ...creatorData,
      chatList: sortedChatList,
      activeChat: sortedChatList.find(
        chat => chat.converse_channel_id === activeChannelId
      ),
    });
  }

  /**
   * Set complete messages for a specific creator's chat
   */
  setCompleteMessages(creatorId: string, messages: MessageInterface[]): void {
    const creatorData = this.getCreatorData(creatorId);
    const activeChat = creatorData.activeChat;
    if (!activeChat) return;

    this.setCreatorData(creatorId, {
      ...creatorData,
      activeChat: {
        ...activeChat,
        complete_messages: messages,
      },
    });

    // Update chat list with new messages
    const currentChatList = creatorData.chatList;
    const updatedChatList = currentChatList.map(chat =>
      chat._id === activeChat._id
        ? { ...chat, complete_messages: messages }
        : chat
    );

    this.setCreatorData(creatorId, {
      ...creatorData,
      chatList: updatedChatList,
    });
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

  /**
   * Create empty creator data structure
   */
  private createEmptyCreatorData(): CreatorChatData {
    return {
      chatList: [],
      activeChat: null,
      activeChannelId: '',
      targetPerson: null,
      converseToken: '',
      isLoading: false,
      userDetails: { _id: '', token: '' },
      firstItemIndex: 0,
    };
  }
}

/**
 * Factory function to create agency chat manager
 */
export function createAgencyChatManager(
  stateManager: IAgencyChatStateManager
): AgencyChatManager {
  return new AgencyChatManager(stateManager);
}
