import React, { useCallback, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

import { useMessageSend } from '../../hooks/useMessageSend';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export interface ChatBarProps {
  creatorId?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. Text is only
 * cleared on a successful send, so a failed send doesn't lose the draft.
 */
export function ChatBar({
  creatorId,
  disabled = false,
  placeholder = 'Type a message…',
  className,
}: ChatBarProps): React.ReactElement {
  const { sendMessage } = useMessageSend(creatorId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = text.trim().length > 0 && !disabled && !sending;

  const submit = useCallback(async () => {
    const value = text.trim();
    if (!value || disabled || sending) return;
    setSending(true);
    try {
      await sendMessage(value);
      setText('');
    } finally {
      setSending(false);
    }
  }, [text, disabled, sending, sendMessage]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className={cn('flex items-end gap-2 border-t bg-background p-3', className)}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message"
        className={cn(
          'max-h-32 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none',
          'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
      <Button
        type="button"
        size="icon"
        onClick={() => void submit()}
        disabled={!canSend}
        aria-label="Send message"
      >
        <SendHorizontal />
      </Button>
    </div>
  );
}
