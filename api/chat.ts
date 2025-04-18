import type { Chat } from "types/chat";
import { API } from "./setup";

export const GetChatList = (page: number = 1, limit: number = 100) => {
  return API.get(
    `${API.USERS}/get-converse-channel?page=${page}&limit=${limit}`
  ) as Promise<{
    data: Chat[];
    message: string;
    status: number;
  }>;
};
