import type { Chat, ChatPerson, MessageInterface } from "types/chat";
import { indexedDBStorage } from "utils/indexedDBStorage";
import { create } from "zustand";

import { devtools, persist } from "zustand/middleware";

const persistMiddleware = <T>(f: (set: any, get: any, api: any) => T) =>
  devtools(
    persist(f, {
      name: "knky-chat",
      storage: indexedDBStorage("knky-chat"),
    })
  );

interface ChatState {
  chatList: Chat[];
  setChatList: (chatList: Chat[]) => void;
  activeChat: Chat | null;
  setActiveChat: (person: Chat) => void;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  targetPerson: ChatPerson | null;
  setTargetPerson: (person: ChatPerson) => void;
  converseToken: string;
  setConverseToken: (token: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setCompleteMessages: (messages: MessageInterface[]) => void;
  addMessage: (message: MessageInterface) => void;
  userDetails: {
    _id: string;
    token: string;
  };
  setUserDetails: (userDetails: { _id: string; token: string }) => void;
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
    converseToken: "",
    setConverseToken(token) {
      set({ converseToken: token });
    },
    isLoading: false,
    setIsLoading(isLoading) {
      set({ isLoading });
    },
    setCompleteMessages: (messages: MessageInterface[]) =>
      set((state) => ({
        activeChat: {
          ...(state.activeChat || {}),
          complete_messages: messages,
        },
        chatList: state.chatList.map((chat) => {
          if (chat._id === state.activeChat?._id) {
            return {
              ...chat,
              complete_messages: messages,
            };
          }
          return chat;
        }),
      })),
    addMessage: (message: MessageInterface) =>
      set((state) => ({
        activeChat: {
          ...(state.activeChat || {}),
          complete_messages: [
            ...(state.activeChat?.complete_messages || []),
            message,
          ],
        },
        chatList: state.chatList
          .map((chat: Chat) => {
            if (chat._id === state.activeChat?._id) {
              return {
                ...chat,
                complete_messages: [
                  ...(state.activeChat?.complete_messages || []),
                  message,
                ],
              };
            }
            return chat;
          })
          .sort((a: Chat, b: Chat) => {
            const aTime = new Date(
              a.complete_messages?.[a.complete_messages.length - 1]
                ?.createdAt ||
                a.message?.createdAt ||
                0
            ).getTime();

            const bTime = new Date(
              b.complete_messages?.[b.complete_messages.length - 1]
                ?.createdAt ||
                b.message?.createdAt ||
                0
            ).getTime();

            return bTime - aTime;
          }),
      })),
    userDetails: {
      _id: "",
      token: "",
    },
    setUserDetails: (userDetails: { _id: string; token: string }) =>
      set((state) => ({
        userDetails: {
          ...state.userDetails,
          ...userDetails,
        },
      })),
  }))
);

export default useChatStore;
