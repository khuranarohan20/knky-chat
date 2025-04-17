import { GetChatList } from "api/chat";
import { Button } from "~/components/ui/button";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";

const Chat = () => {
  useAsyncEffect(async () => {
    GetChatList().then((res) => {
      console.log(res);
    });
  }, []);

  return (
    <div>
      Main Chat Page
      <Button>This is a button</Button>
    </div>
  );
};

export default Chat;
