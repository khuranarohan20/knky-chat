import { GetChatList } from "api/chat";
import { useState } from "react";
import { toast } from "sonner";
import { getAssetUrl } from "utils/asset";
import { myUserId } from "~/chat/chat";
import { useAsyncEffect } from "~/hooks/useAsyncEffect";
import ChatHeader from "./ChatHeader";
import ChatListTabs from "./ChatListTabs";

const ChatList = () => {
  const [list, setList] = useState<any[]>([]);

  useAsyncEffect(async () => {
    try {
      const response = await GetChatList();
      console.log(response.data);
      setList(response.data);
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
  }, []);

  return (
    <div className="bg-white p-3 pb-0 rounded-lg shadow-sm w-full h-full flex flex-col">
      <ChatHeader />
      <ChatListTabs />
      <div className="h-full overflow-y-scroll w-full overflow-x-hidden">
        {list.map((item, idx) => (
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
            key={idx}
          >
            <div className="flex items-center gap-2">
              <div>
                <img
                  src={getAssetUrl({
                    media:
                      item?.initiator?._id === myUserId
                        ? item?.target?.avatar
                        : item?.initiator?.avatar,
                    defaultType: "avatar",
                  })}
                  height={40}
                  width={40}
                />
              </div>
              <div>
                {item?.initiator?._id === myUserId
                  ? item?.target?.display_name
                  : item?.initiator?.display_name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
