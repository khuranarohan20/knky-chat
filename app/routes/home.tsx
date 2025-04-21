import { API } from "api/setup";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import chatSocket from "utils/chat-socket";
import useChatStore from "zustand/store";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { setUserDetails, converseToken } = useChatStore((state) => state);

  const [username, setUsername] = useState("");

  const handleClick = async () => {
    try {
      const response = (await API.get(
        API.USERS + "/user-name" + `/${username}`
      )) as {
        data: [
          {
            _id: string;
            token: string;
          }
        ];
      };

      setUserDetails({
        _id: response.data[0]._id,
        token: response.data[0].token,
      });
      await chatSocket.init();
    } catch (error) {
      console.error("Error fetching token:", error);
      toast.error("Error fetching token and id");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (username.length > 40) {
      val = username.slice(0, 40);
    }
    val = val.toLowerCase();
    setUsername(val);
  };

  return (
    <div className="flex flex-col h-screen">
      <div>This is the KNKY Chat home page</div>
      <div className="flex items-center justify-center flex-col my-10">
        <input
          type="text"
          max={40}
          placeholder="Enter username"
          value={username}
          className="w-50 border-2 border-gray-300 rounded-md p-2 mb-4"
          onChange={handleChange}
        />
        <Button className="mb-2" onClick={handleClick}>
          Fetch Token and UserId
        </Button>
      </div>
      <Button
        onClick={() => {
          if (!converseToken) {
            toast.error("Please fetch token and id first");
            return;
          }
          navigate("/chat");
        }}
      >
        Click to go to chat
      </Button>
    </div>
  );
}
