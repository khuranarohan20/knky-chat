const ChatBar = () => {
  return (
    <div className="border-t flex items-center gap-3 p-3">
      <div>
        <img src="/svgs/plus-circle.svg" height={32} width={32} />
      </div>
      <div className="flex-1">
        <input
          type="text"
          className="w-full rounded-lg border p-2 text-sm"
          placeholder="Enter your message"
        />
      </div>
    </div>
  );
};

export default ChatBar;
