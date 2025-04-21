import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import chatSocket from "utils/chat-socket";

const ChatBar = () => {
  const [message, setMessage] = useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    setMessage(e.target.value);
  }

  async function handleSendMessage() {
    if (message === "") return;
    try {
      await chatSocket.sendMessage({
        message,
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Could not send message, please try again.");
    }
  }

  return (
    <div className="border-t flex items-center gap-3 p-3">
      <div className="cursor-pointer">
        <img src="/svgs/plus-circle.svg" height={32} width={32} />
      </div>
      <div className="flex-1">
        <input
          type="text"
          className="w-full rounded-lg border p-2 text-sm"
          placeholder="Enter your message"
          onChange={handleChange}
          value={message}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
      </div>
      <div className="cursor-pointer">
        <img
          src="/images/send-button.png"
          height={32}
          width={32}
          className={message === "" ? "grayscale" : ""}
          onClick={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatBar;
