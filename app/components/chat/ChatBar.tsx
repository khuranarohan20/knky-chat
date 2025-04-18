import { useState, type ChangeEvent } from "react";

const ChatBar = () => {
  const [message, setMessage] = useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    setMessage(e.target.value);
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
        />
      </div>
      <div className="cursor-pointer">
        <img
          src="/images/send-button.png"
          height={32}
          width={32}
          className={message === "" ? "grayscale" : ""}
        />
      </div>
    </div>
  );
};

export default ChatBar;
