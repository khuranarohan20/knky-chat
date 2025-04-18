import useChatStore from "zustand/store";
import DateFormatter from "~/utils/DateFormatter";
import ChatBubblesShimmer from "../shimmers/ChatBubbleShimmer";

const ChatBubbles = () => {
  const isLoading = useChatStore((s) => s.isLoading);

  if (isLoading) {
    return <ChatBubblesShimmer />;
  }

  return (
    <div className="flex-1 p-4 space-y-4 bg-white">
      <div className="flex items-start">
        <div className="max-w-md px-4 py-2 bg-[#F5F5F6] rounded">
          <div>Hello! How are you?</div>
          <DateFormatter
            dateString={new Date().toISOString()}
            formatType="HH:mm"
            className="text-sm text-[var(--gray-color)] w-full"
          />
        </div>
      </div>

      <div className="flex justify-end items-start">
        <div className="max-w-md px-4 py-2 bg-white rounded border border-[#AFB1B3]">
          <div>I'm good, thanks! What about you?</div>
          <DateFormatter
            dateString={new Date().toISOString()}
            formatType="HH:mm"
            className="text-sm text-[var(--gray-color)] w-full text-right"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatBubbles;
