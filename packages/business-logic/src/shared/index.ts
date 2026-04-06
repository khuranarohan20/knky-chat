// Shared Business Logic
// Platform-agnostic business logic shared by core and agency platforms

import type { MessageInterface, Chat } from '@knky-chat/core-chat';

/**
 * Seen receipt interface
 */
export interface SeenReceipt {
  user_id: string;
  timestamp: string;
  message_id: string;
  channel_id: string;
}

/**
 * Pin message interface
 */
export interface PinMessage {
  message_id: string;
  channel_id: string;
  pinned_by: string;
  pinned_at: string;
}

/**
 * Message handler - manages message lifecycle
 */
export class MessageHandler {
  /**
   * Validate message before sending
   */
  static validateMessage(message: string): { valid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > 10000) {
      return {
        valid: false,
        error: 'Message exceeds maximum length of 10000 characters',
      };
    }

    return { valid: true };
  }

  /**
   * Process message meta data
   */
  static processMeta(meta?: Partial<MessageInterface['meta']>): MessageInterface['meta'] {
    return {
      type: 'message',
      ...meta,
    };
  }

  /**
   * Create message object
   */
  static createMessage(
    text: string,
    senderId: string,
    channelId: string,
    meta?: Partial<MessageInterface['meta']>
  ): MessageInterface {
    return {
      _id: crypto.randomUUID(),
      message: text,
      sender_id: senderId,
      channel_id: channelId,
      meta: this.processMeta(meta),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message_deleted_by: [],
      reactions: [],
    };
  }

  /**
   * Update existing message
   */
  static updateMessage(
    message: MessageInterface,
    updates: Partial<MessageInterface>
  ): MessageInterface {
    return {
      ...message,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mark message as deleted for user
   */
  static markAsDeleted(
    message: MessageInterface,
    userId: string
  ): MessageInterface {
    return {
      ...message,
      message_deleted_by: [...(message.message_deleted_by || []), userId],
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Seen manager - handles message read receipts
 */
export class SeenManager {
  private seenMessages: Map<string, SeenReceipt[]> = new Map();

  /**
   * Mark message as seen
   */
  static markAsSeen(
    channelId: string,
    messageId: string,
    userId: string
  ): SeenReceipt {
    return {
      user_id: userId,
      timestamp: new Date().toISOString(),
      message_id: messageId,
      channel_id: channelId,
    };
  }

  /**
   * Get seen status for message
   */
  static getSeenStatus(
    message: MessageInterface,
    currentUserId: string
  ): 'seen' | 'delivered' | 'sent' {
    const seenBy = message.meta?.seen_by || [];
    const hasOwnSeen = seenBy.some(
      receipt => receipt.user_id === currentUserId
    );

    if (hasOwnSeen) {
      return 'seen';
    }

    return seenBy.length > 0 ? 'delivered' : 'sent';
  }

  /**
   * Update message with seen receipt
   */
  static updateWithSeenReceipt(
    message: MessageInterface,
    receipt: SeenReceipt
  ): MessageInterface {
    const existingSeenBy = message.meta?.seen_by || [];
    return {
      ...message,
      meta: {
        ...message.meta,
        seen_by: [...existingSeenBy, receipt],
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Pin manager - handles message pinning
 */
export class PinManager {
  private pinnedMessages: Map<string, PinMessage[]> = new Map();

  /**
   * Pin message
   */
  static pinMessage(
    channelId: string,
    messageId: string,
    userId: string
  ): PinMessage {
    return {
      message_id: messageId,
      channel_id: channelId,
      pinned_by: userId,
      pinned_at: new Date().toISOString(),
    };
  }

  /**
   * Unpin message
   */
  static getPinIndex(
    pinnedMessages: PinMessage[],
    messageId: string
  ): number | null {
    return pinnedMessages.findIndex(pin => pin.message_id === messageId);
  }

  /**
   * Check if message is pinned
   */
  static isPinned(
    pinnedMessages: PinMessage[],
    messageId: string
  ): boolean {
    return pinnedMessages.some(pin => pin.message_id === messageId);
  }

  /**
   * Remove pin
   */
  static removePin(
    pinnedMessages: PinMessage[],
    messageId: string
  ): PinMessage[] {
    return pinnedMessages.filter(pin => pin.message_id !== messageId);
  }
}

/**
 * Chat manager - handles chat list operations
 */
export class ChatManager {
  /**
   * Calculate total unread count
   */
  static calculateTotalUnread(chats: Chat[]): number {
    return chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
  }

  /**
   * Filter chats by search term
   */
  static searchChats(chats: Chat[], searchTerm: string): Chat[] {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return chats;
    }

    const term = searchTerm.toLowerCase();
    return chats.filter(chat => {
      const targetName = chat.target.display_name.toLowerCase();
      const initiatorName = chat.initiator.display_name.toLowerCase();
      return (
        targetName.includes(term) ||
        initiatorName.includes(term) ||
        chat.message?.message?.toLowerCase().includes(term)
      );
    });
  }

  /**
   * Sort chats by priority (unread, then by time)
   */
  static sortChatsByPriority(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
      // Unread chats first
      if (a.unread_count > 0 && b.unread_count === 0) {
        return -1;
      }
      if (b.unread_count > 0 && a.unread_count === 0) {
        return 1;
      }

      // Then by last message time
      const aTime = this.getLastMessageTime(a);
      const bTime = this.getLastMessageTime(b);
      return bTime - aTime;
    });
  }

  /**
   * Get last message timestamp from chat
   */
  private static getLastMessageTime(chat: Chat): number {
    const message = chat.message;
    if (!message) return 0;

    if (typeof message === 'string') {
      return 0;
    }

    return new Date(message.createdAt).getTime();
  }

  /**
   * Update chat with new message
   */
  static updateChatWithMessage(
    chats: Chat[],
    channelId: string,
    message: MessageInterface
  ): Chat[] {
    return chats.map(chat => {
      if (chat.converse_channel_id === channelId) {
        return {
          ...chat,
          message,
          unread_count: chat.unread_count + 1,
        };
      }
      return chat;
    });
  }
}

/**
 * Pagination helper - manages message pagination
 */
export class PaginationManager {
  /**
   * Calculate pagination info
   */
  static getPaginationInfo(
    totalItems: number,
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * Get page range
   */
  static getPageRange(
    currentPage: number,
    pageSize: number
  ): { start: number; end: number } {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize - 1;
    return { start, end };
  }

  /**
   * Validate page number
   */
  static validatePageNumber(
    page: number,
    totalPages: number
  ): { valid: boolean; correctedPage?: number } {
    if (page < 1) {
      return { valid: false, correctedPage: 1 };
    }
    if (page > totalPages && totalPages > 0) {
      return { valid: false, correctedPage: totalPages };
    }
    return { valid: true };
  }
}

/**
 * Utility functions exports
 */
export const BusinessLogicUtils = {
  MessageHandler,
  SeenManager,
  PinManager,
  ChatManager,
  PaginationManager,
};
