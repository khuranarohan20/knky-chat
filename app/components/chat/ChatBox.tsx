import { useParams } from "react-router";
import ChatBar from "./ChatBar";
import ChatBubbles from "./ChatBubbles";
import ChatPerson from "./ChatPerson";
import EmptyChat from "./EmptyChat";

const ChatBox = () => {
  const { id: targetUserId } = useParams();

  if (!targetUserId) {
    return <EmptyChat />;
  }
  return (
    <div className="bg-white pb-0 rounded-lg shadow-sm w-full lg:max-w-[66.666%] h-full hidden md:flex flex-col ">
      <ChatPerson />
      <ChatBubbles />
      <ChatBar />
    </div>
  );
};

export default ChatBox;
