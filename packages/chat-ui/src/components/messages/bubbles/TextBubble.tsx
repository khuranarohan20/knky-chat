import React from 'react';

import type { MessageInterface } from '@knky-chat/core-chat';

/** Plain text message. */
export function TextBubble({ message }: { message: MessageInterface }): React.ReactElement | null {
  if (!message.message) return null;
  return <p className="whitespace-pre-wrap break-words">{message.message}</p>;
}
