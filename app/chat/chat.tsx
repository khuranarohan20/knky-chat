import ChatBox from "~/components/chat/ChatBox";
import ChatList from "~/components/chat/ChatList";

const Chat = () => {
  return (
    <div className="flex h-full p-3 overflow-hidden gap-3 flex-col lg:flex-row">
      <ChatList />
      <ChatBox />
    </div>
  );
};

export default Chat;
