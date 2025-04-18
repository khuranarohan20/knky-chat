import { Funnel, SearchIcon, SettingsIcon } from "lucide-react";
import { Input } from "../ui/input";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold w-full">Chat</div>
      <div className="flex gap-2 w-full items-center justify-center">
        <div className="flex items-center w-full bg-[var(--gray-bg)] rounded-2xl p-1">
          <SearchIcon />
          <Input
            placeholder="Search..."
            className="border-0 shadow-none"
            type="search"
          />
        </div>
        <div>
          <Funnel />
        </div>
        <div>
          <SettingsIcon />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
