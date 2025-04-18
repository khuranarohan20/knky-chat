import ChatBar from "./ChatBar";
import ChatBubbles from "./ChatBubbles";
import ChatPerson from "./ChatPerson";

const ChatBox = () => {
  return (
    <div className="bg-white pb-0 rounded-lg shadow-sm w-full lg:max-w-[66.666%] h-full flex flex-col">
      <ChatPerson />
      <ChatBubbles />
      <ChatBar />
    </div>
  );
};

export default ChatBox;
