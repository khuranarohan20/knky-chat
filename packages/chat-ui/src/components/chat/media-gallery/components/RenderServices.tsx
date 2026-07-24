import { memo, useEffect, useRef } from 'react';

import { useResolvedCreatorId } from '../../../../hooks/useResolvedCreatorId';
import { useActiveChannelId, useChatStore } from '../../../../store/chatStore';
import { Icon } from '../../../common/Icon';
import DateFormatter from '../../../common/DateFormatter';
import { RenderMessage } from '../../../messages/RenderMessage';
import type { ServiceItem } from '../types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../../ui/context-menu';

const RenderService = memo(function RenderService(props: { service: ServiceItem[]; date: string }) {
  const userId = useResolvedCreatorId();
  const channelId = useActiveChannelId(userId);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const jumpToMessage = useChatStore((s) => s.jumpToMessage);

  // Match the agency: the bubble renders as w-sm; widen its first child to fill.
  const attachRef = (node: HTMLDivElement | null) => {
    const child = node?.firstElementChild as HTMLElement | null;
    if (child) {
      child.classList.remove('w-sm');
      child.classList.add('w-full');
    }
  };

  const parentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const child = parentRef.current?.firstElementChild as HTMLElement | null;
    if (child) {
      child.classList.remove('w-sm');
      child.classList.add('w-full');
    }
  }, []);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <DateFormatter dateString={props.date} formatType="MMM dd, yyyy" isMessage />
      </div>
      <div className="flex flex-col gap-2">
        {props.service.map((service, index) => (
          <div key={index} className="relative w-full select-none">
            <ContextMenu>
              <ContextMenuTrigger>
                <div className="w-full" ref={attachRef}>
                  <RenderMessage message={service.message_data as any} currentUserId={userId} />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    setShowSharedContent(false);
                    jumpToMessage(userId, { chatId: channelId, messageId: service.converse_message_id, messageTime: service.converse_message_created_at });
                  }}
                >
                  <Icon icon="go-to-message" size={16} />
                  Show Message
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RenderService;
