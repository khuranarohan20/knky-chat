import type { ConverseChannel } from '../socket/ChatConnection';

interface QueuedReceipt {
  messageId: string;
  senderId: string;
}

/**
 * SeenReceiptQueue: batches seen receipts and flushes them on a debounce timer.
 *
 * Both source apps debounce seen calls — core at 100ms, agency at 120ms.
 * Sending one `seenMessage` per received message causes a socket flood;
 * batching deduplicates within the flush window and sends a single call.
 *
 * Usage:
 *   const q = new SeenReceiptQueue(channel, 100)
 *   q.enqueue(messageId, senderId)
 *   // ... flushes automatically after FLUSH_MS of inactivity
 *   q.destroy() // on channel close
 */
export class SeenReceiptQueue {
  private pending = new Map<string, QueuedReceipt>(); // messageId → receipt (deduped)
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private getChannel: () => ConverseChannel | null,
    private flushMs: number,
  ) {}

  enqueue(messageId: string, senderId: string): void {
    this.pending.set(messageId, { messageId, senderId });
    this.scheduleFlush();
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.pending.size) return;

    const receipts = Array.from(this.pending.values());
    this.pending.clear();

    const channel = this.getChannel();
    channel?.seenMessage(receipts);
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending.clear();
  }

  private scheduleFlush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, this.flushMs);
  }
}
