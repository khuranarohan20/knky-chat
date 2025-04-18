const ChatBubblesShimmer = () => {
  return Array.from({ length: 3 }).map((_, idx) => (
    <div className="flex-1 p-4 space-y-4 bg-white animate-pulse" key={idx}>
      <div className="flex items-start">
        <div className="max-w-md px-4 py-2 bg-[#F5F5F6] rounded space-y-2 w-full">
          <div className="w-3/4 h-4 bg-gray-300 rounded" />
          <div className="w-1/4 h-3 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="flex justify-end items-start">
        <div className="max-w-md px-4 py-2 bg-white border border-[#AFB1B3] rounded space-y-2 w-full">
          <div className="w-2/3 h-4 bg-gray-300 rounded ml-auto" />
          <div className="w-1/4 h-3 bg-gray-200 rounded ml-auto" />
        </div>
      </div>
    </div>
  ));
};

export default ChatBubblesShimmer;
