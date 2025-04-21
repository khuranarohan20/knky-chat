import { GetChatList } from "api/chat";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Dot } from "lucide-react";
import { toast } from "sonner";
import type { Chat, MessageInterface } from "types/chat";
import { getAssetUrl } from "utils/asset";
import chatSocket from "utils/chat-socket";
import useChatStore from "zustand/store";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";
import { cn } from "~/lib/utils";
import ChatListShimmer from "../shimmers/ChatListShimmer";
import ChatHeader from "./ChatHeader";
import ChatListTabs from "./ChatListTabs";

const ChatList = () => {
  const {
    chatList: list,
    setChatList: setList,
    setActiveChat,
    setActiveChannelId,
    activeChat,
    activeChannelId,
    isLoading,
    setIsLoading,
    setCompleteMessages,
    userDetails,
  } = useChatStore((state) => state);
  const myUserId = userDetails._id;

  useAsyncEffect(async () => {
    try {
      const response = await GetChatList();

      if (response.data.length === 0) return;
      let chatList = response.data.filter((c) => c.message);
      setList(chatList);
      setActiveChat(chatList?.[0]);
      setActiveChannelId(chatList?.[0].converse_channel_id);
      const promise = chatSocket.updateChannel(
        chatList?.[0]?.converse_channel_id
      );
      toast.promise(promise, {
        loading: "Connecting...",
        success: async (channel) => {
          const { msgs } = await channel.getMessages({});
          setCompleteMessages([
            ...msgs.read,
            ...msgs.unread,
          ] as MessageInterface[]);
          return "Connected!";
        },
        error: "Error",
      });
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
  }, []);

  async function handleChatClick(chat: Chat) {
    if (chat === activeChat) return;

    setActiveChat(chat);
    setActiveChannelId(chat.converse_channel_id);
    const promise = chatSocket.updateChannel(chat.converse_channel_id);
    toast.promise(promise, {
      loading: "Connecting...",
      success: async (channel) => {
        if (!channel) return;
        setIsLoading(true);
        const { msgs } = await channel.getMessages({});
        setCompleteMessages([
          ...msgs.read,
          ...msgs.unread,
        ] as MessageInterface[]);
        setIsLoading(false);
        return "Connected!";
      },
      error: "Error",
    });
  }

  if (isLoading) {
    return <ChatListShimmer />;
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

          const message =
            item?.complete_messages?.[item?.complete_messages?.length - 1] ||
            item?.message;

          const hasUnreadCount = item?.unread_count > 0;

          return (
            <div
              className={cn(
                {
                  "border-[var(--primary-color)]":
                    item?.converse_channel_id === activeChannelId,
                  "border-transparent":
                    item?.converse_channel_id !== activeChannelId,
                },
                "border-l-3 flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer relative"
              )}
              key={idx}
              onClick={() => handleChatClick(item)}
            >
              {hasUnreadCount && (
                <div className="absolute top-3 right-0 w-5 h-5 text-white bg-[var(--primary-color)] rounded-full flex items-center justify-center text-xs font-medium">
                  {item.unread_count}
                </div>
              )}
              <div className="flex items-center gap-2 w-full">
                <img
                  src={getAssetUrl({ media: avatar, defaultType: "avatar" })}
                  height={56}
                  width={56}
                  className="rounded-full shrink-0 object-cover"
                />
                <div className="flex flex-col min-w-0 w-full">
                  <div
                    className={cn("truncate font-medium", {
                      "font-bold": hasUnreadCount,
                    })}
                  >
                    {displayName}
                  </div>
                  <div className="flex items-center min-w-0 w-full">
                    <div
                      className={cn(
                        "truncate text-[var(--gray-color)] text-sm min-w-0 w-fit",
                        {
                          "font-bold": hasUnreadCount,
                        }
                      )}
                    >
                      {message?.message}
                    </div>
                    <div className="w-fit">
                      <Dot />
                    </div>
                    <div className="shrink-0 text-[var(--gray-color)] text-sm whitespace-nowrap">
                      {formatDistanceToNow(new Date(message?.createdAt), {
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
