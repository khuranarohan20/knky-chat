import React from 'react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';
import { useChatConfig } from '../../../hooks/useChatConfig';
import { BubbleTime } from '../BubbleTime';
import { AudioSent, RatingSent, VideoSent } from '../svg';

const PURCHASE_SERVICE = "You can't buy service on behalf of the creator.";

/** Promotional request amount (offered → discounted → base price), matching the agency calc. */
function promoAmount(meta: any): number {
  const price = meta?.price;
  if (meta?.offered_amount) return meta.offered_amount;
  const dv = meta?.discount?.discount_value;
  if (price !== undefined && meta?.has_discount && typeof dv === 'number') {
    const multiplier = meta?.type === 'VIDEO' || meta?.type === 'VOICE' ? (meta?.duration ?? 60) / 60 : 1;
    return dv * multiplier;
  }
  return price ?? 0;
}

function promoTitle(type: string): string {
  const t = type.toUpperCase();
  if (t === 'VOICE') return 'Voice call';
  if (t === 'VIDEO') return 'Video call';
  if (t === 'CUSTOM-SERVICE') return 'Request';
  return 'Ratings';
}

/** Icon: request_icon override, else the type's default SVG / service image. */
function PromoIcon({ meta, resolve }: { meta: any; resolve: (m: any) => string }): React.ReactElement {
  const t = (meta?.type || '').toString().toUpperCase();
  const hasIcon = !!meta?.request_icon?.length;
  const imgProps = {
    height: 72,
    width: 72,
    alt: 'Request Icon',
    className: 'rounded-3xl',
    draggable: false as const,
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
    onDragStart: (e: React.SyntheticEvent) => e.preventDefault(),
    style: { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties,
  };
  if (hasIcon) return <img src={resolve(meta.request_icon[0])} {...imgProps} />;
  if (t === 'CUSTOM-SERVICE') return <img src="/images/chat/service-icon.png" {...imgProps} />;
  const fallback = t === 'VOICE' ? <AudioSent /> : t === 'VIDEO' ? <VideoSent /> : <RatingSent />;
  return (
    <div className="overflow-hidden rounded-3xl" style={{ height: 72, width: 72 }}>
      {fallback}
    </div>
  );
}

/**
 * Promotional request bubble (mass-message VIDEO/VOICE/RATING/CUSTOM-SERVICE).
 * `isMine` → sender view (creator, status badge); else receiver view (fan, Accept CTA).
 * Ported verbatim from agency PromotionSender/PromotionReceiver.
 */
export function Promotion({ message, isMine }: { message: MessageInterface; isMine: boolean }): React.ReactElement {
  const { getAssetUrl, toast } = useChatConfig();
  const resolve = (m: any) => (m ? getAssetUrl({ media: m }) : '');
  const meta: any = message?.meta ?? {};
  const t = (meta?.type || '').toString().toUpperCase();
  const isRequestSent = meta?.requestAccept === 'sent';
  const declined = meta?.requestAccept === false;

  const durationLabel = ['VOICE', 'VIDEO'].includes(t)
    ? `For ${Math.ceil((meta?.duration || 0) / (60 * (meta?.is_mass_message ? 60 : 1)))} mins`
    : isMine
    ? '1 turn'
    : '1 request';

  const header = (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <PromoIcon meta={meta} resolve={resolve} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-base font-semibold">{promoTitle(t)}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div>{durationLabel}</div>
          <div className="h-4 w-px bg-black opacity-50" />
          <div className="font-medium text-foreground">{formatCurrency(promoAmount(meta))}</div>
        </div>
      </div>
    </div>
  );

  const note = meta?.request_note ? (
    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-bold">{meta.request_note}</p>
  ) : null;

  if (isMine) {
    // Sender (creator) view — status badge top-right.
    return (
      <div className="relative ms-auto mt-1 grid h-full w-sm gap-3 rounded-xl border bg-white p-3 break-words">
        {header}
        <div className="absolute right-0 top-0 m-2">
          {isRequestSent ? (
            <div className="rounded border border-yellow-600 bg-yellow-100 p-1 text-xs text-yellow-600">Waiting for fan</div>
          ) : (
            <div className={cn('rounded border p-1 text-xs', declined ? 'border-red-600 bg-red-100 text-red-600' : 'border-green-600 bg-green-100 text-green-600')}>
              {declined ? 'Declined' : 'Accepted'}
            </div>
          )}
        </div>
        {note}
        <BubbleTime message={message} isMine={isMine} />
      </div>
    );
  }

  // Receiver (fan) view — status badge + Accept CTA.
  return (
    <div className="relative flex w-sm flex-col rounded-lg p-2 break-words">
      <div className="absolute right-0 top-0 m-2">
        {isRequestSent ? (
          <span className="rounded-md border px-2 py-0.5 text-xs" style={{ color: 'rgba(136,77,255,1)', borderColor: 'rgba(136,77,255,1)', backgroundColor: 'rgba(136,77,255,0.12)' }}>New</span>
        ) : (
          <span
            className="rounded-md border px-2 py-0.5 text-xs"
            style={{
              color: declined ? 'rgba(245,34,45,1)' : 'rgba(86,194,45,1)',
              borderColor: declined ? 'rgba(245,34,45,1)' : 'rgba(86,194,45,1)',
              backgroundColor: declined ? 'rgba(245,34,45,0.2)' : 'rgba(86,194,45,0.2)',
            }}
          >
            {declined ? 'Declined' : 'Accepted'}
          </span>
        )}
      </div>
      {header}
      {note}
      {isRequestSent ? (
        <div className="mt-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => toast?.error?.(PURCHASE_SERVICE)}>
            Accept for {formatCurrency(promoAmount(meta))}
          </button>
        </div>
      ) : null}
      <BubbleTime message={message} isMine={isMine} />
    </div>
  );
}
