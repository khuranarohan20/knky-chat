import React from 'react';
import { Gift } from 'lucide-react';

import type { MessageInterface } from '@knky-chat/core-chat';

/** "Sent a tip" bubble. */
export function SentTip({ message }: { message: MessageInterface }): React.ReactElement {
  const amount = message.meta?.amount;
  return (
    <div className="flex items-center gap-2">
      <Gift className="size-4 shrink-0" />
      <span className="font-medium">
        Tip{amount ? ` · $${amount}` : ''}
      </span>
    </div>
  );
}
