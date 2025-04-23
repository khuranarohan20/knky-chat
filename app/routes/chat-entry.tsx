import { useEffect } from "react";
import { useParams } from "react-router";
import type { MessageInterface } from "types/chat";
import chatSocket from "utils/chat-socket";
import { useAppDispatch, useAppSelector } from "zustand/hooks";
import Chat from "~/chat/chat";

export default function ChatEntry() {
  const { id } = useParams();
  const dispatch = useAppDispatch().chatActions;
  const chatList = useAppSelector((s) => s.chatList);
  useEffect(() => {
    if (!id) return;

    const selected = chatList.find(
      (c) => c.initiator?._id === id || c.target?._id === id
    );
    if (!selected) return;

    dispatch.setActiveChat(selected);
    dispatch.setActiveChannelId(selected.converse_channel_id);

    chatSocket
      .updateChannel(selected.converse_channel_id)
      .then(async (channel) => {
        const { msgs } = await channel.getMessages({});
        dispatch.setCompleteMessages([
          ...msgs.read,
          ...msgs.unread,
        ] as MessageInterface[]);
      });
  }, [id, chatList]);

  return (
    <div className="flex flex-col h-screen">
      <Chat />
    </div>
  );
}
