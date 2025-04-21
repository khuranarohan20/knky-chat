import { chatStore } from "zustand/store";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestParams {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  isProtected?: boolean;
}

const API_ROUTES = {
  USERS: "/v1/users",
  SHOPS: "/v1/shops",
};

export const API = {
  get: (url: string, headers?: any) =>
    setupAPI({ url, method: "GET", headers }),
  post: (url: string, body?: any, headers?: any) =>
    setupAPI({ url, method: "POST", body, headers }),
  put: (url: string, body?: any, headers?: any) =>
    setupAPI({ url, method: "PUT", body, headers }),
  delete: (url: string, headers?: any) =>
    setupAPI({ url, method: "DELETE", headers }),
  ...API_ROUTES,
};

async function setupAPI({
  url,
  method,
  body,
  headers = {},
  timeout = 10000,
  isProtected = true,
}: RequestParams) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const userDetails = chatStore.getState().userDetails;

  const isJSON = !(body instanceof FormData);
  const finalHeaders = {
    ...(isJSON ? { "Content-Type": "application/json" } : {}),
    "x-api-key": import.meta.env.KNKY_X_API_KEY,
    ...(isProtected
      ? {
          Authorization: `Bearer ${userDetails.token}`,
        }
      : {}),
    ...headers,
  };

  try {
    const response = await fetch(`${import.meta.env.KNKY_BACKEND_URL}${url}`, {
      method,
      headers: finalHeaders,
      body: body ? (isJSON ? JSON.stringify(body) : body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(id);

    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw {
        status: response.status,
        message: response.statusText,
        data,
      };
    }

    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("Request timed out:", url);
    } else {
      console.error("API error:", error);
    }
    throw error;
  }
}
