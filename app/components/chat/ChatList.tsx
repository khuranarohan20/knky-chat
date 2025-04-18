import { GetChatList } from "api/chat";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Dot } from "lucide-react";
import { toast } from "sonner";
import type { Chat } from "types/chat";
import { getAssetUrl } from "utils/asset";
import useChatStore from "zustand/store";
import { myUserId } from "~/chat/chat";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";
import { cn } from "~/lib/utils";
import ChatHeader from "./ChatHeader";
import ChatListTabs from "./ChatListTabs";

const ChatList = () => {
  const {
    chatList: list,
    setChatList: setList,
    setActiveChat,
    setActiveChannelId,
    activeChannelId,
  } = useChatStore((state) => state);

  useAsyncEffect(async () => {
    try {
      const response = await GetChatList();
      if (response.data.length === 0) return;
      let chatList = response.data.filter((c) => c.message);
      setList(chatList);
      setActiveChat(chatList?.[0]);
      setActiveChannelId(chatList?.[0].converse_channel_id);
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
  }, []);

  function handleChatClick(chat: Chat) {
    setActiveChat(chat);
    setActiveChannelId(chat.converse_channel_id);
  }

  return (
    <div className="bg-white p-3 pb-0 rounded-lg shadow-sm w-full lg:max-w-[33.333%] h-full flex flex-col select-none">
      <ChatHeader />
      <ChatListTabs />
      <div className="h-full overflow-y-scroll w-full overflow-x-hidden">
        {list.map((item, idx) => {
          const isInitiator = item?.initiator?._id === myUserId;
          const avatar = isInitiator
            ? item?.target?.avatar?.[0]
            : item?.initiator?.avatar?.[0];

          const displayName = isInitiator
            ? item?.target?.display_name || item?.target?.username
            : item?.initiator?.display_name || item?.initiator?.username;

          const message = item?.message?.message;

          return (
            <div
              className={cn(
                {
                  "border-[var(--primary-color)]":
                    item?.converse_channel_id === activeChannelId,
                  "border-transparent":
                    item?.converse_channel_id !== activeChannelId,
                },
                "border-l-3 flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
              )}
              key={idx}
              onClick={() => handleChatClick(item)}
            >
              <div className="flex items-center gap-2 w-full">
                <img
                  src={getAssetUrl({ media: avatar, defaultType: "avatar" })}
                  height={56}
                  width={56}
                  className="rounded-full shrink-0 object-cover"
                />
                <div className="flex flex-col min-w-0 w-full">
                  <div className="truncate font-medium">{displayName}</div>
                  <div className="flex items-center min-w-0 w-full">
                    <div className="truncate text-[var(--gray-color)] text-sm min-w-0 w-fit">
                      {message}
                    </div>
                    <div className="w-fit">
                      <Dot />
                    </div>
                    <div className="shrink-0 text-[var(--gray-color)] text-sm whitespace-nowrap">
                      {formatDistanceToNow(new Date(item?.message?.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
