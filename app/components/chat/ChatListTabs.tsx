import { Ellipsis } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";

const tabs = [
  "Subscribers",
  "Subscribed",
  "Matches",
  "Others",
  "Boyfriends",
  "Girls",
  "Good Ones",
  "Bad Ones",
  "Sexy Girls",
  "Sexy Boys",
];

const ChatListTabs = () => {
  return (
    <>
      <div className="flex justify-between items-center my-5">
        {tabs.slice(0, 4).map((tab, idx) => (
          <div
            className={cn(
              {
                "text-[var(--primary-color)]": idx === 0,
              },
              "cursor-pointer"
            )}
            key={idx}
          >
            {tab}
          </div>
        ))}
        <ExtraTabs extras={tabs.slice(4)} />
      </div>
      <Separator />
    </>
  );
};

export default ChatListTabs;

const ExtraTabs = (props: { extras: string[] }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center cursor-pointer">
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {props.extras.map((extra, idx) => (
          <DropdownMenuItem className="cursor-pointer" key={idx}>
            {extra}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
