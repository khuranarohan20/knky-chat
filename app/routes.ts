import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/chat.tsx", [route(":id", "routes/chat-entry.tsx")]),
] satisfies RouteConfig;
