import { useEffect } from "react";
import { getAssetUrl } from "utils/asset";
import useChatStore from "zustand/store";
import { myUserId } from "~/chat/chat";

const ChatPerson = () => {
  const { activeChat, targetPerson, setTargetPerson } = useChatStore(
    (state) => state
  );

  useEffect(() => {
    if (activeChat) {
      const target =
        activeChat?.target?._id === myUserId
          ? activeChat?.initiator
          : activeChat?.target;
      setTargetPerson(target);
    }
  }, [activeChat]);

  return (
    <div className="border-b p-3 flex gap-2 items-center">
      <div>
        <img
          src={getAssetUrl({
            media: targetPerson?.avatar?.[0],
            defaultType: "avatar",
          })}
          height={56}
          width={56}
          className="rounded-full object-cover"
        />
      </div>
      <div>
        <div>
          <div>{targetPerson?.display_name}</div>
          <div className="text-[var(--gray-color)] text-sm">
            @{targetPerson?.username}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPerson;
