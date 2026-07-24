import React from 'react';

import { cn } from '../../lib/utils';
import { useAdapter } from '../../adapter/AdapterContext';
import { useChatConfig } from '../../hooks/useChatConfig';
import { useChatStore, useCreators, type CreatorSummary } from '../../store/chatStore';
import Badges from '../common/Badges';

export interface AllCreatorsListingProps {
  className?: string;
}

/**
 * Multi-creator rail — ported from the agency AllCreatorsListing. Vertical list
 * of managed creators (avatar + name + badges + unread badge), with the active
 * creator highlighted and click-to-switch. The per-creator token/socket
 * bootstrap lives in the adapter, so this is purely the switcher UI.
 */
export function AllCreatorsListing({ className }: AllCreatorsListingProps = {}): React.ReactElement {
  const adapter = useAdapter();
  const { getAssetUrl } = useChatConfig();
  const creators = useCreators();
  const currentCreatorId = useChatStore((s) => s.currentCreatorId);
  const chatData = useChatStore((s) => s.chatDataByCreator);
  const setCurrentCreatorId = useChatStore((s) => s.setCurrentCreatorId);

  const switchTo = (id: string) => {
    if (id === currentCreatorId) return;
    if (adapter.switchCreator) void adapter.switchCreator(id);
    else setCurrentCreatorId(id);
  };

  return (
    <div className={cn('flex flex-1 flex-col items-center gap-2 overflow-y-scroll overflow-x-hidden bg-[#F7F7FC]', creators.length > 0 && 'p-2', className)}>
      {creators.map((creator: CreatorSummary) => {
        const id = creator.id;
        const isActive = id === currentCreatorId;
        const isLoading = !!creator.connecting;
        const unread = chatData[id]?.totalUnreadCount ?? 0;
        return (
          <div
            key={id}
            className={cn('flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg px-3 py-2', {
              'bg-[#F3E9F2]': isActive,
              'cursor-wait': isLoading,
            })}
            onClick={() => !isLoading && switchTo(id)}
          >
            <div className="relative inline-block">
              {isLoading ? (
                <div aria-hidden className="pointer-events-none absolute inset-[-6px] animate-spin [animation-duration:3.2s]">
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#6a7282" strokeWidth="4" strokeLinecap="round" strokeDasharray="28 20" />
                  </svg>
                </div>
              ) : null}
              <img
                src={getAssetUrl({ media: creator.avatar?.[0], defaultType: 'avatar' })}
                className={cn('relative z-10 h-[52px] w-[52px] rounded-full object-cover', { 'border-2 border-[#AC1991]': isActive && !isLoading })}
                alt=""
              />
              {!isLoading && unread > 0 ? (
                <div className="absolute bottom-0 right-[-12px] z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-[#504AFF] p-1 text-xs text-white">
                  {unread > 999 ? '999+' : unread}
                </div>
              ) : null}
            </div>
            <div className={cn('flex w-full items-center justify-center', { 'text-[#AC1991]': isActive })}>
              <span className="inline-flex max-w-full items-center">
                <span className="max-w-[12ch] truncate text-center" title={creator.display_name}>
                  {creator.display_name}
                </span>
                <Badges array={creator.badges} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AllCreatorsListing;
