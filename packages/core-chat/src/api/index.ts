// Core Chat API Utilities
// Platform-agnostic API client for chat functionality

import type { Chat } from '../types';

export interface ChatApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export interface ChatListParams {
  page?: number;
  limit?: number;
  is_human?: boolean;
  is_unread?: boolean;
  is_read?: boolean;
  is_active?: boolean;
  is_shy?: boolean;
  is_online?: boolean;
  min_spent_amount?: number;
  max_spent_amount?: number;
  channel_ids?: string[];
  req_search?: string | string[];
}

export interface ChatListResponse {
  data: Chat[];
  message: string;
  status: number;
}

export interface VerifyTokenParams {
  projectId: string;
  token: string;
}

export interface TokenResponse {
  token: string;
}

export interface UserIdResponse {
  data: {
    _id: string;
    token: string;
  }[];
}

/**
 * Abstract API client interface for platform-specific implementations
 */
export interface IChatApiClient {
  getChatList(params?: ChatListParams): Promise<ChatListResponse>;
  verifyToken(params: VerifyTokenParams): Promise<any>;
  requestToken(): Promise<TokenResponse>;
  getUserId(username: string): Promise<UserIdResponse>;
}

/**
 * Base API client implementation using fetch
 */
export class ChatApiClient implements IChatApiClient {
  constructor(private config: ChatApiConfig) {}

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getChatList(params: ChatListParams = {}): Promise<ChatListResponse> {
    const { page = 1, limit = 100 } = params;
    return this.get<{ data: Chat[]; message: string; status: number }>(
      `/users/get-converse-channel?page=${page}&limit=${limit}`
    );
  }

  async verifyToken(params: VerifyTokenParams): Promise<any> {
    return this.post('/users/verify-converse-token', params);
  }

  async requestToken(): Promise<TokenResponse> {
    const response = await this.get<{ token: string }>(
      '/users/request-converse-token'
    );
    return { token: response.token };
  }

  async getUserId(username: string): Promise<UserIdResponse> {
    return this.get(`/users/user-name/${username}`);
  }
}

/**
 * Factory function to create API client with platform-specific configuration
 */
export function createChatApiClient(config: ChatApiConfig): IChatApiClient {
  return new ChatApiClient(config);
}
