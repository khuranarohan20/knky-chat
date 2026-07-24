import React, { useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { CirclePlus, PlusCircle, XIcon } from 'lucide-react';

import type { Media } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { normalizeKnkyLinks } from '../../lib/links';
import { useAdapter } from '../../adapter/AdapterContext';
import { useChatConfig } from '../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useActiveChannelId, useChatStore, useReplyMessage, useTargetPerson, useTemplate } from '../../store/chatStore';
import { Icon } from '../common/Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const MIN_MEDIA_PRICE = 1;
const MAX_MEDIA_PRICE = 10_000;
const MEDIA_FEE_DEFAULT = 1;

export interface ChatBarProps {
  creatorId?: string;
  className?: string;
}

/**
 * Message composer — ported from the agency ChatBar. Text sends over the
 * socket connection; media/attachments (device files or vault media, with an
 * optional unlock fee) go through the host's sendMediaMessage seam. Supports
 * reply preview, template prefill, and the "+" options menu (promote / share /
 * device media / vault / templates).
 */
export function ChatBar({ creatorId, className }: ChatBarProps): React.ReactElement {
  const adapter = useAdapter();
  const id = useResolvedCreatorId(creatorId);
  const { getAssetUrl, openModal, openVault, toast } = useChatConfig();

  const channelId = useActiveChannelId(id);
  const targetPerson = useTargetPerson(id);
  const replyMessage = useReplyMessage(id);
  const template = useTemplate(id);
  const setReplyMessage = useChatStore((s) => s.setReplyMessage);
  const setTemplate = useChatStore((s) => s.setTemplate);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState<(Media | File)[]>([]);
  const [price, setPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('');
  const [hasFeeSet, setHasFeeSet] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Template prefill.
  useEffect(() => {
    if (template.message || template.vault_media_ids?.length || template.price) {
      setMessage(template.message);
      setMedia(template.vault_media_ids || []);
      setPrice(template.price || 0);
    }
  }, [template.message, template.vault_media_ids, template.price]);

  useEffect(() => {
    if (price !== +priceInput) setPriceInput(price > 0 ? price.toString() : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  useEffect(() => {
    if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 200);
  }, [replyMessage?.message?._id, replyMessage?.message?.messageId]);

  // Clear the reply when switching channel/creator.
  useEffect(() => {
    setReplyMessage(id, null);
  }, [id, channelId, setReplyMessage]);

  const replyActive = replyMessage && replyMessage.channelId === channelId && replyMessage.message;
  const replyMeta = replyActive ? { replyMessage: replyMessage!.message } : {};

  async function sendMedia() {
    const vaultMedia: Media[] = media.some((m) => m instanceof File) ? [] : (media as Media[]);
    const files = media.filter((m): m is File => m instanceof File);
    const finalMessage = normalizeKnkyLinks(message);
    try {
      setMedia([]);
      await adapter.getApi().sendMediaMessage?.({
        channelId,
        creatorId: id,
        message: finalMessage || 'Attachment',
        files,
        vaultMediaIds: vaultMedia.map((m) => m._id).filter(Boolean) as string[],
        mediaFee: hasFeeSet && price >= MIN_MEDIA_PRICE ? price : undefined,
        replyMessage: replyActive ? replyMessage!.message : null,
      });
      setReplyMessage(id, null);
      setMessage('');
      setTemplate(id, { message: '', price: 0, vault_media_ids: [] });
      setHasFeeSet(false);
      setPrice(0);
    } catch (error) {
      console.error(error);
      setMedia(vaultMedia);
    }
  }

  async function sendMessage() {
    if ((!message || message.trim() === '') && !media.length) return;
    if (media.length > 0) {
      await sendMedia();
      return;
    }
    if (message.length > 2000) {
      toast?.error?.('Message must be less than 2000 characters');
      return;
    }
    const finalMessage = normalizeKnkyLinks(message);
    const conn = adapter.getConnection(id);
    await conn?.sendMessage({
      text: finalMessage,
      meta: adapter.enrichMeta({ type: 'message', converseId: channelId, ...replyMeta } as any),
    });
    setReplyMessage(id, null);
    setMessage('');
    setMedia([]);
  }

  const disabledSend = (!message || message.trim() === '') && media.length === 0;

  return (
    <div className={cn('relative flex w-full items-center justify-between gap-3 rounded-b-lg border border-t bg-white p-2', className)}>
      {replyActive ? (
        <div
          className={cn('absolute left-0 z-10 flex h-[70px] w-full items-center justify-between gap-2 bg-[#F7F7FC] p-2', {
            'bottom-[150px]': media.length > 0,
            'bottom-[50px]': media.length === 0,
          })}
        >
          <div className="shrink-0">
            <Icon icon="reply" color="pink" />
          </div>
          <div className="flex h-full min-w-0 flex-1 flex-col justify-center rounded border-l-[3px] border-[#ac1991] bg-[#AC19911A] p-2">
            <div className="flex w-full items-center gap-2">
              {Array.isArray(replyMessage!.message.meta?.media) && replyMessage!.message.meta!.media!.length > 0 ? (
                <img
                  src={getAssetUrl({ media: replyMessage!.message.meta!.media![0], poster: replyMessage!.message.meta!.media![0]?.type === 'video' })}
                  className="h-[30px] w-[30px] rounded object-cover"
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/common/defaultBack.svg';
                  }}
                />
              ) : null}
              <div className="w-full">
                <div className="text-sm font-semibold text-[#AC1991]">
                  Reply to{' '}
                  {replyMessage!.message.sender_id === id || replyMessage!.message.sid === id || !replyMessage!.message.sender_id
                    ? 'You'
                    : targetPerson?.display_name}
                </div>
                <div className="truncate text-xs text-[#AC1991]">{replyMessage!.message.message}</div>
              </div>
            </div>
          </div>
          <div onClick={() => setReplyMessage(id, null)}>
            <CirclePlus className="rotate-45 cursor-pointer" />
          </div>
        </div>
      ) : null}

      {media.length > 0 ? (
        <div className="absolute bottom-[50px] left-0 z-10 flex w-full flex-col overflow-hidden rounded-lg border-2 border-dotted border-gray-200 bg-white">
          <div className="flex gap-2 overflow-auto p-1" style={{ height: 90 }}>
            {media.map((m, idx) => (
              <div key={idx} className="relative flex h-full items-center">
                <img
                  src={m instanceof File ? URL.createObjectURL(m) : getAssetUrl({ media: m, poster: m.type === 'video', variation: 'compressed' })}
                  height={70}
                  width={70}
                  className="h-full rounded-lg object-cover"
                  alt=""
                />
                <div
                  className="absolute end-0 top-0 cursor-pointer rounded bg-black/50"
                  onClick={() => setMedia((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <XIcon color="white" size={18} />
                </div>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-2 flex items-center justify-between rounded border border-gray-200 px-3 py-1.5">
            <div className="flex w-full items-center gap-1">
              {hasFeeSet ? <span className="text-sm font-medium text-gray-500">$</span> : null}
              <input
                type="text"
                value={hasFeeSet ? priceInput : 'Free'}
                onChange={(e) => {
                  const match = e.target.value.match(/^\d*\.?\d{0,2}$/);
                  if (match) {
                    const cleaned = match[0].replace(/^0(?=\d)/, '');
                    if (+cleaned > MAX_MEDIA_PRICE) return;
                    setPriceInput(cleaned);
                    setPrice(+cleaned || 0);
                  }
                }}
                onBlur={() => {
                  if (hasFeeSet && +priceInput < MIN_MEDIA_PRICE) {
                    setPriceInput(MIN_MEDIA_PRICE.toString());
                    setPrice(MIN_MEDIA_PRICE);
                  }
                }}
                disabled={!hasFeeSet}
                placeholder="0"
                className={cn('w-full border-none bg-transparent text-sm font-semibold outline-none', hasFeeSet ? 'text-gray-900' : 'text-gray-400')}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasFeeSet(true);
                  if (!priceInput || +priceInput < MEDIA_FEE_DEFAULT) {
                    setPriceInput(MEDIA_FEE_DEFAULT.toString());
                    setPrice(MEDIA_FEE_DEFAULT);
                  }
                }}
                className={cn(
                  'text-nowrap rounded px-3 py-1 text-xs font-medium transition-colors',
                  hasFeeSet ? 'border border-gray-900 bg-gray-900 text-white' : 'border-none bg-transparent text-gray-500',
                )}
              >
                Unlock fee
              </button>
              <button
                type="button"
                onClick={() => setHasFeeSet(false)}
                className={cn(
                  'text-nowrap rounded px-3 py-1 text-xs font-medium transition-colors',
                  !hasFeeSet ? 'border border-gray-900 bg-gray-900 text-white' : 'border-none bg-transparent text-gray-500',
                )}
              >
                Free
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ChatBarOptions
        creatorId={id}
        openModal={openModal}
        openVault={openVault}
        setMedia={setMedia}
        trigger={
          <PlusCircle
            className={cn('cursor-pointer transition duration-200', { '-rotate-45': open, 'rotate-0': !open })}
            onClick={() => setOpen(!open)}
          />
        }
      />

      <input
        ref={inputRef}
        className="w-full flex-1 rounded-md border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Type message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void sendMessage();
        }}
      />

      <img
        src="/images/send-button.png"
        height={24}
        width={24}
        alt="Send"
        className={cn('cursor-pointer', { 'grayscale-100': disabledSend })}
        onClick={() => void sendMessage()}
      />
    </div>
  );
}

export default ChatBar;

function ChatBarOptions({
  trigger,
  creatorId,
  setMedia,
  openModal,
  openVault,
}: {
  trigger: ReactNode;
  creatorId: string;
  setMedia: Dispatch<SetStateAction<(Media | File)[]>>;
  openModal?: (key: string, payload?: unknown) => void;
  openVault?: (input: { readonly?: boolean; creatorId?: string }) => Promise<{ medias: Media[] }>;
}): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) setMedia((prev) => prev.concat(Array.from(files)));
  };

  async function handleVaultMedia() {
    if (!openVault) return;
    const res = await openVault({ readonly: true, creatorId });
    setMedia((prev) => prev.concat(res.medias));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer bg-[#31A9FF14] text-[#31A9FF] focus:bg-[#31A9FF14] focus:text-[#31A9FF] [&_svg]:!size-6"
            onClick={() => openModal?.('PROMOTE_SERVICE')}
          >
            <Icon icon="promote-options" iconFolder="stand-alone-icons" size={20} />
            Promote services
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openModal?.('SHARE_ENTITY')}>
            <Icon icon="money" size={20} />
            Share Content
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={(e) => {
              e.preventDefault();
              fileRef.current?.click();
            }}
          >
            <Icon icon="media" size={20} />
            Choose Media from device
          </DropdownMenuItem>
          <input
            type="file"
            ref={fileRef}
            hidden
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
          />
          <DropdownMenuItem className="cursor-pointer" onClick={handleVaultMedia}>
            <Icon icon="vault" size={20} />
            Choose from vault
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer [&_svg]:!size-6" onClick={() => openModal?.('MESSAGE_TEMPLATE')}>
            <Icon icon="template" size={20} />
            Message Templates
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
