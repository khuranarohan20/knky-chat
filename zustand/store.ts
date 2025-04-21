import type { Chat, ChatPerson, MessageInterface } from "types/chat";
import { indexedDBStorage } from "utils/indexedDBStorage";
import { devtools, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export interface Setters {
  setChatList: (chatList: Chat[]) => void;
  setActiveChat: (chat: Chat) => void;
  setActiveChannelId: (id: string) => void;
  setTargetPerson: (person: ChatPerson) => void;
  setConverseToken: (token: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setUserDetails: (details: { _id: string; token: string }) => void;
  setCompleteMessages: (messages: MessageInterface[]) => void;
  addMessage: (message: MessageInterface, channelId: string) => void;
}

export interface ChatState extends Setters {
  chatList: Chat[];
  activeChat: Chat | null;
  activeChannelId: string;
  targetPerson: ChatPerson | null;
  converseToken: string;
  isLoading: boolean;
  userDetails: {
    _id: string;
    token: string;
  };
}

export const chatStore = createStore<ChatState>()(
  devtools(
    persist(
      (set) => ({
        chatList: [],
        activeChat: null,
        activeChannelId: "",
        targetPerson: null,
        converseToken: "",
        isLoading: false,
        userDetails: { _id: "", token: "" },

        setChatList: (chatList) => set({ chatList }),
        setActiveChat: (chat) =>
          set({
            activeChat: {
              ...chat,
              unread_count: 0,
            },
          }),
        setActiveChannelId: (id) => set({ activeChannelId: id }),
        setTargetPerson: (person) => set({ targetPerson: person }),
        setConverseToken: (token) => set({ converseToken: token }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setUserDetails: (details) =>
          set((state) => ({
            userDetails: {
              ...state.userDetails,
              ...details,
            },
          })),
        setCompleteMessages: (messages) => {
          const currentChat = chatStore.getState().activeChat;
          if (!currentChat) return;

          set((state) => ({
            activeChat: {
              ...currentChat,
              complete_messages: messages,
            },
            chatList: state.chatList.map((chat) =>
              chat._id === currentChat._id
                ? { ...chat, complete_messages: messages }
                : chat
            ),
          }));
        },

        addMessage: (message, channelId) =>
          set((state) => {
            const updatedChatList = state.chatList.map((chat) => {
              if (chat.converse_channel_id === channelId) {
                const newMessages = [
                  ...(chat.complete_messages || []),
                  message,
                ];
                return {
                  ...chat,
                  message,
                  complete_messages: newMessages,
                  unread_count: chat.unread_count + 1,
                };
              }
              return chat;
            });

            const sortedChatList = updatedChatList.sort((a, b) => {
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
            });

            const isUpdatingActiveChat =
              state.activeChat?.converse_channel_id === channelId;

            return {
              chatList: sortedChatList,
              activeChat: isUpdatingActiveChat
                ? {
                    ...state.activeChat,
                    complete_messages: [
                      ...(state.activeChat.complete_messages || []),
                      message,
                    ],
                    message,
                  }
                : state.activeChat,
            };
          }),
      }),
      {
        name: "knky-chat",
        storage: indexedDBStorage("knky-chat"),
      }
    )
  )
);
