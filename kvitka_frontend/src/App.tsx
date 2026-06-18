import { useState } from "react";
import { LoginPage } from "./LoginPage";
import type { AuthUser } from "./LoginPage";
import { ChatPage } from "./ChatPage";
import { ProfilePage } from "./ProfilePage";
import { LibraryPage } from "./LibraryPage";
import { DocumentPage } from "./DocumentPage";
import { AdminPage } from "./AdminPage";

type Page =
  | { name: "login" }
  | { name: "chat" }
  | { name: "profile" }
  | { name: "library" }
  | { name: "document"; docTitle: string }
  | { name: "admin" };

export default function App() {
  const [page, setPage] = useState<Page>({
    name: "login" });
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    setPage({ name: "chat" });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    setUser(null);
    setPage({ name: "login" });
  };

  switch (page.name) {
    case "login":
      return <LoginPage onLogin={handleLogin} />;

    case "profile":
      return (
        <ProfilePage
          user={user}
          onBack={() => setPage({ name: "chat" })}
          onLogout={handleLogout}
        />
      );

    case "library":
      return (
        <LibraryPage
          onBack={() => setPage({ name: "chat" })}
          onOpenDocument={(title) => setPage({ name: "document", docTitle: title })}
        />
      );

    case "document":
      return (
        <DocumentPage
          docTitle={page.docTitle}
          onBack={() => setPage({ name: "library" })}
        />
      );

    case "admin":
      return <AdminPage user={user} onBack={() => setPage({ name: "chat" })} />;

    case "chat":
    default:
      return (
        <ChatPage
          user={user}
          onOpenProfile={() => setPage({ name: "profile" })}
          onOpenLibrary={() => setPage({ name: "library" })}
          onOpenAdmin={() => setPage({ name: "admin" })}
          onOpenDocument={(title) => setPage({ name: "document", docTitle: title })}
        />
      );
  }
}
