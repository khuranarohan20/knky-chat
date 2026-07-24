import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns/format';
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import InfiniteScroll from 'react-infinite-scroll-component';

import type { ChatStatsInterface, Media, Transactions } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { formatCurrency, formatCompactCurrency } from '../../lib/format';
import { useAdapter } from '../../adapter/AdapterContext';
import { useChatConfig } from '../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useActiveChatStats, useChatStore, useTargetPerson } from '../../store/chatStore';
import { Icon } from '../common/Icon';

const DEBOUNCE_DELAY = 800;

const validityLabels: Record<string, string> = {
  MONTHLY: '1 Month',
  QUARTERLY: '3 Months',
  HALF_YEARLY: '6 Months',
  YEARLY: '1 Year',
};

const STATUS_STYLES = {
  active: { color: '#138607', bgColor: '#13860714' },
  cancelled: { color: '#F11E11', bgColor: 'rgba(241, 30, 17, 0.1)' },
  expired: { color: '#808386', bgColor: 'rgba(128, 131, 134, 0.08)' },
} as const;
type StatusType = keyof typeof STATUS_STYLES;

const paymentCategoriesMapper: Record<string, string> = {
  Tip: 'Tip',
  ChannelSubscription: 'Subscription',
  Message: 'Message',
  SpecialOptions: 'Service',
  Promotion: 'Promotion',
  PremiumStory: 'Story Purchase',
  PremiumPost: 'Clips',
  Ticket: 'Ticket',
  ChatFee: 'Chat Fee',
  ProductSell: 'Product Sell',
  ChannelSubscriptionRenewal: 'Subscription Renewal',
  AudioMediaPurchase: 'Audio Media Purchase',
  MediaPurchase: 'Media Purchase',
  PerMessageChatFee: 'Per Message ChatFee',
  ChatFeeServicePurchase: 'Chat FeeService Purchase',
  SubscriptionUpgrade: 'Subscription Upgrade',
};

// Tiny trailing-edge debounce (avoids a lodash dependency).
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
  wrapped.cancel = () => {
    if (t) clearTimeout(t);
  };
  return wrapped;
}

export interface ChatStatsProps {
  creatorId?: string;
  /** Rendered inside a host drawer (vs a fixed side panel). */
  drawer?: boolean;
}

/**
 * Fan statistics drawer — ported from the agency ChatStats: subscription
 * summary, editable notes (debounced auto-save), total/chat spend, and an
 * infinite-scrolling transaction list. Data comes from the host's optional
 * getChatStats / getTransactionsBetweenUsers / updateNotes API methods.
 */
function ChatStatsBase({ creatorId, drawer = false }: ChatStatsProps): React.ReactElement {
  const id = useResolvedCreatorId(creatorId);
  const api = useAdapter().getApi();
  const { toast } = useChatConfig();
  const setActiveChatStats = useChatStore((s) => s.setActiveChatStats);
  const currStats = useActiveChatStats(id);
  const targetUser = useTargetPerson(id);
  const targetId = targetUser?._id || '';

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transactions[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (!targetId || !api.getChatStats) return;
    let cancelled = false;
    setIsInitialLoadComplete(false);
    setTransactions([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    (async () => {
      try {
        const stats = await api.getChatStats!({ userId: targetId, creatorId: id });
        const txns = (await api.getTransactionsBetweenUsers?.({ targetUserId: targetId, page: 1, limit: 20, creatorId: id })) ?? [];
        if (cancelled) return;
        setPage(2);
        if (txns.length < 20) setHasMore(false);
        setTransactions(txns);
        setActiveChatStats(id, stats);
        setNotes(stats.notes ?? '');
        setIsInitialLoadComplete(true);
      } catch (error) {
        console.error('Error fetching chat stats:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, id]);

  const saveNotes = useCallback(
    async (value: string, stats: ChatStatsInterface | null) => {
      if (!stats || !api.updateNotes) return;
      if (value === stats.notes) {
        toast?.error?.('No changes made');
        return;
      }
      try {
        await api.updateNotes({ userId: targetId, notes: value, creatorId: id });
        setActiveChatStats(id, { ...stats, notes: value });
        toast?.success?.('Notes updated successfully');
      } catch (error) {
        console.error(error);
        toast?.error?.('Error updating notes');
      }
    },
    [api, targetId, id, setActiveChatStats, toast],
  );

  const debouncedSaveNotes = useMemo(
    () =>
      debounce((value: string) => {
        if (!isInitialLoadComplete) return;
        void saveNotes(value, currStats);
      }, DEBOUNCE_DELAY),
    [isInitialLoadComplete, currStats, saveNotes],
  );

  useEffect(() => () => debouncedSaveNotes.cancel(), [debouncedSaveNotes]);

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(e.target.value);
      debouncedSaveNotes(e.target.value);
    },
    [debouncedSaveNotes],
  );

  const handleNextTransactions = useCallback(async () => {
    if (isFetchingNext || !hasMore || !targetId || !api.getTransactionsBetweenUsers) return;
    setIsFetchingNext(true);
    try {
      const data = await api.getTransactionsBetweenUsers({ targetUserId: targetId, page, creatorId: id });
      setTransactions((prev) => {
        const seen = new Set(prev.map((tx) => tx._id));
        return [...prev, ...data.filter((tx) => !seen.has(tx._id))];
      });
      setPage((p) => p + 1);
      if (data.length < 20) setHasMore(false);
    } catch (error) {
      console.error('Error fetching next transactions:', error);
    } finally {
      setIsFetchingNext(false);
    }
  }, [hasMore, isFetchingNext, page, targetId, id, api]);

  const statusBadge = (status: StatusType) => {
    const config = STATUS_STYLES[status];
    if (!config) return null;
    return (
      <span
        className="rounded px-1 text-[11px]"
        style={{ color: config.color, border: `1px solid ${config.color}`, backgroundColor: config.bgColor }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading || !currStats) {
    return <StatisticsShimmer drawer={drawer} />;
  }

  const ch = currStats.activeChannel?.[0];

  return (
    <div
      id="transactions-scroll-container"
      className={cn('relative flex flex-col gap-3 overflow-auto overflow-x-hidden rounded-3xl', { 'border p-3': !drawer })}
      style={drawer ? undefined : { width: '30rem', backgroundColor: '#fff', borderColor: '#E7E7F8' }}
    >
      {currStats.activeChannel?.length > 0 && ch ? (
        <>
          <div className="text-gray-500">
            Subscribed to: <span className="font-bold text-black">{validityLabels[ch.package_type]}</span>{' '}
            {statusBadge(!ch.is_cancelled ? 'active' : (ch.expires_on ?? '') < new Date().toISOString() ? 'expired' : 'cancelled')}
          </div>
          <div className="text-sm text-gray-500">
            for {formatCurrency(ch.initial_amount)} on {format(new Date(ch.created_at), 'MMM dd, yy')} (
            {formatDistanceToNowStrict(new Date(ch.created_at || ''), { addSuffix: false })})
            {!ch.is_cancelled && ch.expires_on ? (
              <>
                , next renew at {formatCurrency(ch.renewal_price)} in {formatDistanceToNowStrict(new Date(ch.expires_on || ''), { addSuffix: false })}
              </>
            ) : null}
          </div>
        </>
      ) : (
        <div className={cn('text-lg font-bold', { 'text-center': drawer })}>Statistics</div>
      )}

      <div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Icon icon="edit-icon" iconFolder="stand-alone-icons" size={16} />
          <span>Notes</span>
        </div>
        <textarea
          className="w-full resize-none rounded border border-gray-300 px-3 py-2"
          rows={10}
          value={notes}
          onChange={handleNotesChange}
          placeholder="Enter notes here"
        />
      </div>

      <div>
        <div className="text-xs text-gray-500">
          Total spend:{' '}
          <span className="font-bold text-black">
            {formatCompactCurrency(currStats.total_spend)}{' '}
            <span className="font-normal text-gray-500">({formatCompactCurrency(currStats.average_total_spend_per_month)} avg. /mo)</span>
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Chat spend: {formatCompactCurrency(currStats.chat_spend)} ({formatCompactCurrency(currStats.average_chat_spend_per_month)} avg. /mo)
        </div>
      </div>

      <div className="flex grow flex-col">
        <div className="font-bold">Latest transactions</div>
        {transactions.length > 0 ? (
          <InfiniteScroll
            dataLength={transactions.length}
            hasMore={hasMore}
            loader={
              <>
                <TransactionItemShimmer />
                <hr />
                <TransactionItemShimmer />
              </>
            }
            next={handleNextTransactions}
            scrollableTarget="transactions-scroll-container"
          >
            {transactions.map((txn) => (
              <div key={txn._id}>
                <TransactionItem amount={txn.total_amount} category={txn.category} createdAt={txn.created_at} media={txn.media_thumbnail || []} />
                <hr />
              </div>
            ))}
          </InfiniteScroll>
        ) : (
          <div className="text-sm text-gray-500">No transactions</div>
        )}
      </div>
    </div>
  );
}

export const ChatStats = memo(ChatStatsBase);

const TransactionItem = memo(function TransactionItem(props: {
  createdAt: string;
  category: string;
  amount: string | number;
  media: Media[];
}) {
  const { getAssetUrl } = useChatConfig();
  const formatCustomDate = useCallback((date: Date) => {
    const time = format(date, 'HH:mm');
    if (isToday(date)) return time;
    if (isYesterday(date)) return `${time} - Yesterday`;
    return `${time} - ${format(date, `dd MMM${new Date().getFullYear() === date.getFullYear() ? '' : ', yy'}`)}`;
  }, []);

  const m = props.media?.[0];
  const variation = m?.variations?.includes('compressed')
    ? 'compressed'
    : m?.variations?.includes('thumbnail')
    ? 'thumbnail'
    : m?.variations?.includes('thumb')
    ? 'thumb'
    : 'blur';

  return (
    <div className="py-3 text-xs text-gray-500">
      <div className="flex justify-between gap-2">
        <div className="flex w-full items-center gap-2">
          <span>+{formatCurrency(+props.amount)}</span>
          <span className="truncate">{paymentCategoriesMapper[props.category] || props.category}</span>
        </div>
        <div className="shrink-0 text-xs">{formatCustomDate(new Date(props.createdAt))}</div>
      </div>
      {props.media.length > 0 ? (
        <img
          src={getAssetUrl({ media: m, poster: m?.type === 'video', defaultType: 'background', variation })}
          alt="Txn Media"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/common/defaultBack.svg';
          }}
          className="h-10 w-10 rounded object-cover"
        />
      ) : null}
    </div>
  );
});

function TransactionItemShimmer(): React.ReactElement {
  return (
    <div className="py-3 text-xs">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-10 animate-pulse rounded bg-gray-200" />
          <div className="size-2 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function StatisticsShimmer({ drawer }: { drawer?: boolean }): React.ReactElement {
  return (
    <div className={cn('flex flex-col gap-3 rounded-3xl', { 'border p-3': !drawer })} style={drawer ? undefined : { width: '30rem' }}>
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
      <TransactionItemShimmer />
      <hr />
      <TransactionItemShimmer />
    </div>
  );
}
