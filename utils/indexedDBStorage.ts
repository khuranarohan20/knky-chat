import { del, get, set } from "idb-keyval";

export const indexedDBStorage = (key: string) => ({
  getItem: async () => {
    const value = await get(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (_key: string, value: any) => {
    await set(key, JSON.stringify(value));
  },
  removeItem: async () => {
    await del(key);
  },
});
