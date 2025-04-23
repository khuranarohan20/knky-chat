import { GetChatList } from "api/chat";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Dot } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { Chat, MessageInterface } from "types/chat";
import { getAssetUrl } from "utils/asset";
import chatSocket from "utils/chat-socket";
import { useAppDispatch, useAppSelector } from "zustand/hooks";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";
import { cn } from "~/lib/utils";
import ChatListShimmer from "../shimmers/ChatListShimmer";
import ChatHeader from "./ChatHeader";
import ChatListTabs from "./ChatListTabs";

const ChatList = () => {
  const dispatch = useAppDispatch().chatActions;
  const navigate = useNavigate();
  const { id: targetUserId } = useParams();

  const {
    chatList: list,
    activeChat,
    activeChannelId,
    isLoading,
    userDetails,
  } = useAppSelector((state) => state);

  const myUserId = userDetails._id;

  useAsyncEffect(async () => {
    try {
      const response = await GetChatList();

      if (response.data.length === 0) return;
      let chatList = response.data
        .filter((c) => c.message)
        .sort((a, b) => {
          const aTime = new Date(
            a.complete_messages?.[a.complete_messages.length - 1]?.createdAt ||
              a.message?.createdAt ||
              0
          ).getTime();

          const bTime = new Date(
            b.complete_messages?.[b.complete_messages.length - 1]?.createdAt ||
              b.message?.createdAt ||
              0
          ).getTime();

          return bTime - aTime;
        });
      dispatch.setChatList(chatList);

      let targetChat;

      if (targetUserId) {
        targetChat = chatList.find(
          (chat) =>
            chat?.initiator?._id === targetUserId ||
            chat?.target?._id === targetUserId
        );
        if (targetChat) {
          dispatch.setActiveChat(targetChat);
          dispatch.setActiveChannelId(targetChat.converse_channel_id);
        }
      } else {
        targetChat = chatList?.[0];
        dispatch.setActiveChat(chatList?.[0]);
        dispatch.setActiveChannelId(chatList?.[0].converse_channel_id);
      }

      const promise = chatSocket.updateChannel(
        targetChat?.converse_channel_id || chatList?.[0]?.converse_channel_id
      );
      toast.promise(promise, {
        loading: "Connecting...",
        success: async (channel) => {
          const { msgs } = await channel.getMessages({});
          dispatch.setCompleteMessages([
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
  }, [targetUserId]);

  async function handleChatClick(chat: Chat) {
    if (chat === activeChat) return;

    dispatch.setActiveChat(chat);
    dispatch.setActiveChannelId(chat.converse_channel_id);

    await navigate(
      `/chat/${
        chat?.initiator?._id === myUserId
          ? chat?.target?._id
          : chat?.initiator?._id
      }`
    );

    const promise = chatSocket.updateChannel(chat.converse_channel_id);
    toast.promise(promise, {
      loading: "Connecting...",
      success: async (channel) => {
        if (!channel) return;
        dispatch.setIsLoading(true);
        const { msgs } = await channel.getMessages({});
        dispatch.setCompleteMessages([
          ...msgs.read,
          ...msgs.unread,
        ] as MessageInterface[]);
        dispatch.setIsLoading(false);
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
              {hasUnreadCount &&
                item?.converse_channel_id !== activeChannelId && (
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
                      "font-bold":
                        hasUnreadCount &&
                        item?.converse_channel_id !== activeChannelId,
                    })}
                  >
                    {displayName}
                  </div>
                  <div className="flex items-center min-w-0 w-full">
                    <div
                      className={cn(
                        "truncate text-[var(--gray-color)] text-sm min-w-0 w-fit",
                        {
                          "font-bold":
                            hasUnreadCount &&
                            item?.converse_channel_id !== activeChannelId,
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
