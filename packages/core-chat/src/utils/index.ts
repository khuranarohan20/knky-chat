// Core Chat Utilities
// Platform-agnostic utility functions for chat operations

import type { MessageInterface, Chat, ChatFeeType } from '../types';

/**
 * Message filtering utilities
 */
export namespace MessageFilters {
  /**
   * Filter messages by user
   */
  export function byUser(messages: MessageInterface[], userId: string): MessageInterface[] {
    return messages.filter(msg => msg.sender_id === userId);
  }

  /**
   * Filter messages by channel
   */
  export function byChannel(messages: MessageInterface[], channelId: string): MessageInterface[] {
    return messages.filter(msg => msg.channel_id === channelId);
  }

  /**
   * Filter messages by date range
   */
  export function byDateRange(
    messages: MessageInterface[],
    startDate: Date,
    endDate: Date
  ): MessageInterface[] {
    return messages.filter(msg => {
      const msgDate = new Date(msg.createdAt);
      return msgDate >= startDate && msgDate <= endDate;
    });
  }

  /**
   * Filter messages by type (meta.type)
   */
  export function byType(
    messages: MessageInterface[],
    type: MessageInterface['meta']['type']
  ): MessageInterface[] {
    return messages.filter(msg => msg.meta?.type === type);
  }

  /**
   * Filter messages by deletion status
   */
  export function byDeletionStatus(
    messages: MessageInterface[],
    userId: string
  ): MessageInterface[] {
    return messages.filter(msg => {
      const deletedBy = msg.message_deleted_by || [];
      return !deletedBy.includes(userId);
    });
  }
}

/**
 * Message sorting utilities
 */
export namespace MessageSorters {
  /**
   * Sort messages by timestamp (ascending)
   */
  export function byTimestamp(messages: MessageInterface[]): MessageInterface[] {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }

  /**
   * Sort messages by timestamp (descending)
   */
  export function byTimestampDesc(messages: MessageInterface[]): MessageInterface[] {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Sort chats by last message timestamp
   */
  export function chatsByLastMessage(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
      const dateA = getMessageDate(a);
      const dateB = getMessageDate(b);
      return dateB - dateA;
    });
  }

  /**
   * Sort chats by unread count
   */
  export function chatsByUnread(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => b.unread_count - a.unread_count);
  }

  /**
   * Get timestamp from chat message
   */
  function getMessageDate(chat: Chat): number {
    const msg = chat.message;
    if (!msg) return 0;

    if (typeof msg === 'string') {
      return 0; // Can't parse string messages
    }

    return new Date(msg.createdAt).getTime();
  }
}

/**
 * Chat filtering utilities
 */
export namespace ChatFilters {
  /**
   * Filter chats by unread status
   */
  export function byUnread(chats: Chat[]): Chat[] {
    return chats.filter(chat => chat.unread_count > 0);
  }

  /**
   * Filter chats by subscription status
   */
  export function bySubscriber(chats: Chat[]): Chat[] {
    return chats.filter(chat => chat.is_subscriber || chat.is_subscribed);
  }

  /**
   * Filter chats by following status
   */
  export function byFollowing(chats: Chat[]): Chat[] {
    return chats.filter(chat => chat.is_following);
  }

  /**
   * Filter chats by matched status
   */
  export function byMatched(chats: Chat[]): Chat[] {
    return chats.filter(chat => chat.is_matched);
  }

  /**
   * Filter chats by payment reminder status
   */
  export function byPaymentReminder(chats: Chat[]): Chat[] {
    return chats.filter(chat => chat.payment_reminder);
  }

  /**
   * Search chats by username or display name
   */
  export function bySearchTerm(chats: Chat[], term: string): Chat[] {
    const lowerTerm = term.toLowerCase();
    return chats.filter(chat => {
      const targetName = chat.target.display_name.toLowerCase();
      const initiatorName = chat.initiator.display_name.toLowerCase();
      return targetName.includes(lowerTerm) || initiatorName.includes(lowerTerm);
    });
  }
}

/**
 * Message utilities
 */
export namespace MessageUtils {
  /**
   * Check if message is from current user
   */
  export function isMine(message: MessageInterface, userId: string): boolean {
    return message.sender_id === userId;
  }

  /**
   * Check if message has media attachments
   */
  export function hasMedia(message: MessageInterface): boolean {
    return !!message.meta?.media;
  }

  /**
   * Check if message is deleted for user
   */
  export function isDeletedForUser(message: MessageInterface, userId: string): boolean {
    return message.message_deleted_by?.includes(userId) || false;
  }

  /**
   * Get message type (text, media, etc.)
   */
  export function getMessageType(message: MessageInterface): string {
    if (!message.meta) return 'text';

    const media = message.meta.media;
    if (media) {
      return Array.isArray(media) ? 'media_multiple' : 'media';
    }

    return 'text';
  }

  /**
   * Format message timestamp for display
   */
  export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diffMs < 60000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diffMs < 3600000) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago`;
    }

    // Less than 1 day
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours}h ago`;
    }

    // Less than 1 week
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000);
      return `${days}d ago`;
    }

    // Format full date
    return date.toLocaleDateString();
  }

  /**
   * Calculate message read status
   */
  export function calculateReadStatus(message: MessageInterface): 'read' | 'delivered' | 'sent' {
    if (!message.meta) return 'sent';

    const hasReadReceipt = message.meta.seen_by?.length > 0;
    return hasReadReceipt ? 'read' : 'delivered';
  }
}

/**
 * Chat fee utilities
 */
export namespace ChatFeeUtils {
  /**
   * Get chat fee display text
   */
  export function getFeeText(fee: { type: ChatFeeType; price: number }): string {
    const { type, price } = fee;

    switch (type) {
      case 'PerMessage':
        return `${price.toFixed(2)} per message`;
      case 'OneOff':
        return `${price.toFixed(2)} one-time`;
      case 'Minute':
        return `${price.toFixed(2)}/min`;
      case 'Hour':
        return `${price.toFixed(2)}/hour`;
      case 'Day':
        return `${price.toFixed(2)}/day`;
      case 'Week':
        return `${price.toFixed(2)}/week`;
      case 'Month':
        return `${price.toFixed(2)}/month`;
      case 'Free':
        return 'Free';
      default:
        return `${price.toFixed(2)}`;
    }
  }

  /**
   * Check if chat fee is active
   */
  export function isActive(fee: { is_active: boolean }): boolean {
    return fee.is_active === true;
  }

  /**
   * Check if chat fee has discount
   */
  export function hasDiscount(fee: { has_discount: boolean }): boolean {
    return fee.has_discount === true;
  }

  /**
   * Get discount display text
   */
  export function getDiscountText(
    fee: {
      discount?: {
        discount_type: 'percentage' | 'amount';
        discount_value: number;
      };
    }
  ): string {
    const discount = fee.discount;
    if (!discount) return '';

    const { discount_type, discount_value } = discount;
    if (discount_type === 'percentage') {
      return `${discount_value}% off`;
    }
    return `${discount_value.toFixed(2)} off`;
  }
}

/**
 * Validation utilities
 */
export namespace Validators {
  /**
   * Validate chat message
   */
  export function isValidMessage(message: string): boolean {
    return typeof message === 'string' && message.trim().length > 0;
  }

  /**
   * Validate channel ID
   */
  export function isValidChannelId(channelId: string): boolean {
    return typeof channelId === 'string' && channelId.length > 0;
  }

  /**
   * Validate file attachment
   */
  export function isValidFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'video/', 'audio/'];

    return file.size <= maxSize && allowedTypes.some(type => file.type.startsWith(type));
  }

  /**
   * Validate files array
   */
  export function isValidFiles(files: File[]): boolean {
    if (!Array.isArray(files) || files.length === 0) {
      return false;
    }

    return files.every(file => isValidFile(file));
  }
}

/**
 * Constants
 */
export const Constants = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 10,
  DEFAULT_PAGE_SIZE: 100,
  RETRY_ATTEMPTS: 5,
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;
