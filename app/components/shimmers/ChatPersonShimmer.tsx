const ChatPersonShimmer = () => {
  return (
    <div className="border-b p-3 flex gap-2 items-center animate-pulse">
      <div>
        <div className="w-14 h-14 rounded-full bg-gray-300" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="w-32 h-4 bg-gray-300 rounded" />
        <div className="w-24 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default ChatPersonShimmer;
