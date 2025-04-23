import Chat from "~/chat/chat";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "KNKY Chat" },
    { name: "description", content: "Welcome to KNKY!" },
  ];
}

export default function ChatEntry() {
  return (
    <div className="flex flex-col h-screen">
      <Chat />
    </div>
  );
}
