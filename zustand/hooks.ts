import { useStore } from "zustand";
import { chatStore, type ChatState, type Setters } from "./store";

export const useAppSelector = <T>(selector: (state: ChatState) => T): T => {
  return useStore(chatStore, selector);
};

export const useAppDispatch = () => {
  const state = useStore(chatStore);

  const setters = Object.keys(state)
    .filter((key) => key.startsWith("set") || key === "addMessage")
    .reduce((acc, key) => {
      acc[key] = state[key as keyof typeof state];
      return acc;
    }, {} as Partial<Setters>);

  return { chatActions: setters as Setters };
};
