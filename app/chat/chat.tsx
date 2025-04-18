import ChatBox from "~/components/chat/ChatBox";
import ChatList from "~/components/chat/ChatList";

export const myUserId = "6778c9e90af4b8bd174cb80f";

const Chat = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] p-3 overflow-hidden gap-3 flex-col lg:flex-row">
      <ChatList />
      <ChatBox />
    </div>
  );
};

export default Chat;
