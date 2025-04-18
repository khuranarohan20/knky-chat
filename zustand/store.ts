import type { Chat, ChatPerson } from "types/chat";
import { create } from "zustand";

import { devtools, persist } from "zustand/middleware";

const persistMiddleware = <T>(f: (set: any, get: any, api: any) => T) =>
  devtools(persist(f, { name: "knky-chat" }));

interface ChatState {
  chatList: Chat[];
  setChatList: (chatList: Chat[]) => void;
  activeChat: Chat | null;
  setActiveChat: (person: Chat) => void;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  targetPerson: ChatPerson | null;
  setTargetPerson: (person: ChatPerson) => void;
}

const useChatStore = create<ChatState>()(
  persistMiddleware((set) => ({
    chatList: [],
    setChatList: (chatList: Chat[]) => set({ chatList }),
    activeChat: null,
    setActiveChat: (person: Chat) => set({ activeChat: person }),
    activeChannelId: "",
    setActiveChannelId(id) {
      set({ activeChannelId: id });
    },
    targetPerson: null,
    setTargetPerson(person) {
      set({ targetPerson: person });
    },
  }))
);

export default useChatStore;
