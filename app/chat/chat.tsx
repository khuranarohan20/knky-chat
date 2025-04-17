import { GetChatList } from "api/chat";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";

const Chat = () => {
  useAsyncEffect(async () => {
    GetChatList().then((res) => {
      console.log(res);
    });
  }, []);

  return <div>Main Chat Page</div>;
};

export default Chat;
