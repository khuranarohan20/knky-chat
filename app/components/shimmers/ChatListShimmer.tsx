import ChatHeader from "../chat/ChatHeader";
import ChatListTabs from "../chat/ChatListTabs";

const ChatListShimmer = () => {
  return (
    <div className="bg-white p-3 pb-0 rounded-lg shadow-sm w-full lg:max-w-[33.333%] h-full flex flex-col select-none">
      <ChatHeader />
      <ChatListTabs />
      <div className="h-full overflow-y-scroll w-full overflow-x-hidden">
        {[...Array(5)].map((_, idx) => (
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
            key={idx}
          >
            <div className="flex items-center gap-2 w-full animate-pulse">
              <div className="w-full max-w-[56px] h-[56px] rounded-full bg-gray-200" />
              <div className="flex flex-col space-y-3 w-full">
                <div className="w-2/3 h-3 rounded bg-gray-200" />
                <div className="w-1/3 h-3 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatListShimmer;
