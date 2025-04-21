import { useEffect, useRef } from "react";
import useChatStore from "zustand/store";
import { cn } from "~/lib/utils";
import DateFormatter from "~/utils/DateFormatter";
import ChatBubblesShimmer from "../shimmers/ChatBubbleShimmer";

const ChatBubbles = () => {
  const userDetails = useChatStore((s) => s.userDetails);
  const myUserId = userDetails._id;
  const isLoading = useChatStore((s) => s.isLoading);
  const complete_messages =
    useChatStore((s) => s.activeChat?.complete_messages) || [];

  const uid = myUserId;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [complete_messages]);

  if (isLoading) {
    return <ChatBubblesShimmer />;
  }

  return (
    <div
      className="flex-1 p-4 space-y-4 bg-white overflow-scroll flex-col-reverse"
      ref={scrollRef}
    >
      {complete_messages.map((message, index) => {
        const isSender = message?.sender_id === uid || message?.sid === uid;
        const isLast = index === complete_messages.length - 1;

        return (
          <div
            key={message._id}
            className={cn("flex items-start text-sm", {
              "justify-end": isSender,
              "mt-4": !isLast,
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
      })}
    </div>
  );
};

export default ChatBubbles;
