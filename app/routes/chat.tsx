import { Outlet, useParams } from "react-router";
import Chat from "~/chat/chat";

export default function ChatLayout() {
  const { id } = useParams();
  return (
    <div className="flex flex-col h-screen">
      <Outlet />
      {!id && <Chat />}
    </div>
  );
}
