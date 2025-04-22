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

export const VerifyConverseToken = (body: {
  projectId: string;
  token: string;
}) => API.post(`${API.USERS}/verify-converse-token`, body) as Promise<any>;

export const RequestConverseToken = () =>
  API.get(`${API.USERS}/request-converse-token`) as Promise<any>;

export const GetUserToken = (username: string) => {
  return API.get(
    API.USERS + "/user-name" + `/${username}`,
    {},
    false
  ) as Promise<{
    data: [
      {
        _id: string;
        token: string;
      }
    ];
  }>;
};
