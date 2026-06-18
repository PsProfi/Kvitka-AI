import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { ChatPage } from "./ChatPage";

type Page = "login" | "chat";

export default function App() {
  const [page, setPage] = useState<Page>("login");

  return page === "login"
    ? <LoginPage onLogin={() => setPage("chat")} />
    : <ChatPage onLogout={() => setPage("login")} />;
}
