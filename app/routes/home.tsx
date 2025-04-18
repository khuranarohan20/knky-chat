import { useNavigate } from "react-router";
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
  return (
    <div className="flex flex-col h-screen">
      <div>This is the KNKY Chat home page</div>
      <Button
        onClick={() => {
          navigate("/chat");
        }}
      >
        Click to go to chat
      </Button>
    </div>
  );
}
