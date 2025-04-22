import { MESSAGE_FETCH_LIMIT } from "constants/chat";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import chatSocket from "utils/chat-socket";
import { useAppDispatch, useAppSelector } from "zustand/hooks";
import { cn } from "~/lib/utils";
import DateFormatter from "~/utils/DateFormatter";
import ChatBubblesShimmer from "../shimmers/ChatBubbleShimmer";

const ChatBubbles = () => {
  const dispatch = useAppDispatch().chatActions;
  const userDetails = useAppSelector((s) => s.userDetails);
  const myUserId = userDetails._id;
  const isLoading = useAppSelector((s) => s.isLoading);
  const complete_messages =
    useAppSelector((s) => s.activeChat?.complete_messages) || [];
  const firstItemIndex = useAppSelector((s) => s.firstItemIndex);

  const [loading, setLoading] = useState(false);

  const uid = myUserId;

  const loadMore = async () => {
    if (loading) return;
    if (complete_messages.length < MESSAGE_FETCH_LIMIT) return;

    setLoading(true);

    const prevLength = complete_messages.length;

    await chatSocket?.getMoreMessages(complete_messages[0].createdAt);

    const newLength = complete_messages.length;
    const addedCount = newLength - prevLength;

    if (addedCount > 0) {
      dispatch.setFirstItemIndex((prev: number) => prev - addedCount);
    }

    setLoading(false);
  };

  if (isLoading) return <ChatBubblesShimmer />;

  return (
    <div className="flex-1 bg-white p-4">
      {loading && (
        <div className="flex justify-center items-center">
          <LoaderCircle className="animate-spin" />
        </div>
      )}
      <Virtuoso
        data={complete_messages}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={complete_messages.length - 1}
        itemContent={(_, message) => {
          const isSender = message?.sender_id === uid || message?.sid === uid;

          return (
            <div
              key={message._id}
              className={cn("flex items-start text-sm my-2", {
                "justify-end": isSender,
              })}
            >
              <div
                className={cn(
                  "max-w-md px-2 py-2 rounded",
                  isSender ? "bg-[#F5F5F6]" : "bg-white border border-[#AFB1B3]"
                )}
              >
                <div>{message?.message}</div>
                <DateFormatter
                  dateString={message?.createdAt ?? new Date().toISOString()}
                  formatType="HH:mm"
                  className={cn(
                    "text-sm text-[var(--gray-color)] w-full",
                    isSender && "text-right"
                  )}
                />
              </div>
            </div>
          );
        }}
        atTopThreshold={100}
        startReached={loadMore}
      />
    </div>
  );
};

export default ChatBubbles;
