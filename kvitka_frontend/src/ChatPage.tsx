import { useState, useEffect, useRef } from "react";
import type { AuthUser } from "./LoginPage";

// ── Types ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  updatedAt?: string;
}

// ── Static data / stubs ────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    title: "Де знаходиться 127 кабінет?",
    subtitle: "Швидко дізнайтесь аудиторію та найближче місце в закладі.",
  },
  {
    title: "Які зміни в розкладі сьогодні?",
    subtitle: "Будьте в курсі останніх оновлень та перенесень.",
  },
];

const RECENT_CHATS = [
  "Де знаходиться 127 кабінет?",
  "Як записатися на консультацію?",
  "Розклад занять на тиждень",
  "Де знаходиться бібліотека?",
];

function getAIResponse(text: string): ChatMessage {
  const q = text.toLowerCase();
  if (q.includes("127") || q.includes("кабінет") || q.includes("аудиторі")) {
    return {
      role: "assistant",
      content:
        "Кабінет 127 знаходиться на 2 поверсі першого навчального корпусу, у правому крилі будівлі. Від центрального входу піднімайтесь сходами на другий поверх та рухайтесь коридором праворуч приблизно 30 метрів. Кабінет буде розташований з лівого боку коридору.",
      source: "План першого навчального корпусу",
      updatedAt: "15.06.2026, 14:32",
    };
  }
  if (q.includes("розклад") || q.includes("зміни")) {
    return {
      role: "assistant",
      content:
        "Сьогодні в розкладі є зміни: заняття з математики о 10:00 перенесено до аудиторії 215. Заняття з фізики скасовано. Усі інші пари відбуваються згідно з розкладом.",
      source: "Зміни до розкладу занять",
      updatedAt: "18.06.2026, 08:15",
    };
  }
  if (q.includes("бібліотек")) {
    return {
      role: "assistant",
      content:
        "Бібліотека знаходиться на першому поверсі головного корпусу, кабінет 112. Години роботи: пн–пт 8:00–18:00, сб 9:00–15:00.",
    };
  }
  if (q.includes("консультац") || q.includes("записат")) {
    return {
      role: "assistant",
      content:
        "Для запису на консультацію зверніться до деканату (каб. 103) або надішліть запит на електронну пошту деканату. Консультації: вівторок та четвер з 14:00 до 16:00.",
    };
  }
  if (q.includes("дякую") || q.includes("спасибо")) {
    return { role: "assistant", content: "Будь ласка! Якщо виникнуть ще питання — я тут 😊" };
  }
  return {
    role: "assistant",
    content:
      "На жаль, у мене немає точної інформації з цього питання. Спробуйте переформулювати або зверніться до деканату для отримання відповіді.",
  };
}

// ── Props ──────────────────────────────────────────────────────────────────
interface ChatPageProps {
  user: AuthUser | null;
  onOpenProfile: () => void;
  onOpenLibrary: () => void;
  onOpenDocument: (docTitle: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ChatPage({ user, onOpenProfile, onOpenLibrary, onOpenDocument }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = (text: string) => {
    if (!text.trim() || typing) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, getAIResponse(text)]);
    }, 900 + Math.random() * 700);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const initials = (user?.login ?? "?")
    .split(/[\s@_.-]+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  return (
    <div className="cr">
      {/* ── Drawer overlay (mobile) ── */}
      <div
        className={`cr-overlay${drawerOpen ? " is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Sidebar / Drawer ── */}
      <aside className={`cr-sidebar${drawerOpen ? " is-open" : ""}`}>
        {/* Brand header */}
        <div className="sb-head">
          <span className="sb-brand">KVITKA AI</span>
          <div className="sb-head-right">
            <button className="sb-icon-btn" title="Пошук">
              <IconSearch />
            </button>
            <div
              className="sb-avatar"
              onClick={() => { setDrawerOpen(false); onOpenProfile(); }}
              title={user?.login ?? ""}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="sb-nav">
          <button
            className="sb-nav-item"
            onClick={() => { setDrawerOpen(false); onOpenLibrary(); }}
          >
            <IconLibrary />
            <span>бібліотека</span>
          </button>
          <button
            className="sb-nav-item"
            onClick={() => { setMessages([]); setDrawerOpen(false); }}
          >
            <IconPlus />
            <span>Новий чат</span>
          </button>
        </nav>

        {/* Recent chats */}
        <div className="sb-recent">
          <p className="sb-section-label">Нещодавні</p>
          {RECENT_CHATS.map((c, i) => (
            <button
              key={i}
              className="sb-recent-item"
              onClick={() => setDrawerOpen(false)}
            >
              {c}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="cr-main">
        {/* Header */}
        <header className="cr-header">
          <button
            className="cr-hamburger"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Меню"
          >
            <IconMenu />
          </button>
          <h1 className="cr-title">Чат</h1>
          <div style={{ width: 40 }} />
        </header>

        {/* Messages */}
        <div className="cr-messages">
          {messages.length === 0 && !typing ? (
            // ── Empty state ──
            <div className="cr-empty">
              <div className="cr-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="sug-card"
                    onClick={() => sendMessage(s.title)}
                  >
                    <span className="sug-title">{s.title}</span>
                    <span className="sug-sub">{s.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // ── Chat messages ──
            <div className="msg-list">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-row ${msg.role === "user" ? "msg-row--user" : "msg-row--ai"}`}
                >
                  {msg.role === "user" ? (
                    <div className="bubble-user">{msg.content}</div>
                  ) : (
                    <div className="bubble-ai">
                      <p className="bubble-ai-text">{msg.content}</p>
                      {msg.source && (
                        <div className="bubble-ai-meta">
                          <span className="meta-label">Джерело: </span>
                          <button
                            className="meta-link"
                            onClick={() => onOpenDocument(msg.source!)}
                          >
                            {msg.source}
                          </button>
                          {msg.updatedAt && (
                            <div className="meta-updated">
                              <span className="meta-label">Остання оновлення документа: </span>
                              {msg.updatedAt}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="msg-row msg-row--ai">
                  <div className="bubble-ai bubble-ai--typing">
                    <span className="td" />
                    <span className="td" style={{ animationDelay: "0.18s" }} />
                    <span className="td" style={{ animationDelay: "0.36s" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="cr-input-wrap">
          <div className="cr-input-bar">
            <input
              ref={inputRef}
              className="cr-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage(input)
              }
              placeholder="Запитайте щось..."
            />
            <button
              className={`cr-send${input.trim() && !typing ? " cr-send--active" : ""}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              aria-label="Надіслати"
            >
              <IconSend />
            </button>
          </div>
        </div>
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* Root layout */
        .cr {
          display: flex;
          height: 100vh;
          height: 100dvh;
          background: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          color: #1a1a1a;
        }

        /* ── Overlay ── */
        .cr-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0);
          z-index: 150;
          transition: background 0.25s ease;
          pointer-events: none;
        }
        .cr-overlay.is-open {
          pointer-events: auto;
          background: rgba(0,0,0,0.42);
          backdrop-filter: blur(3px);
        }

        /* ── Sidebar ── */
        .cr-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #EBEBEB;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 200;
        }

        .sb-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #EBEBEB;
          flex-shrink: 0;
        }
        .sb-brand {
          font-size: 17px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        .sb-head-right { display: flex; align-items: center; gap: 8px; }

        .sb-icon-btn {
          background: none; border: none; cursor: pointer;
          color: #888; padding: 6px; display: flex; align-items: center;
          border-radius: 8px; transition: background 0.15s;
        }
        .sb-icon-btn:hover { background: #F5F5F5; }

        .sb-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #8A0F29, #C0254A);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800;
          cursor: pointer; transition: transform 0.2s;
          flex-shrink: 0;
        }
        .sb-avatar:hover { transform: scale(1.08); }

        .sb-nav { border-bottom: 1px solid #EBEBEB; }
        .sb-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 13px 18px; width: 100%;
          background: none; border: none; border-bottom: 1px solid #F5F5F5;
          font-size: 14px; font-weight: 500; color: #1a1a1a;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background 0.15s;
        }
        .sb-nav-item:last-child { border-bottom: none; }
        .sb-nav-item:hover { background: #F8F8F8; }

        .sb-recent { flex: 1; overflow-y: auto; padding: 14px 10px; }
        .sb-section-label {
          font-size: 10px; font-weight: 700; color: #AAA;
          text-transform: uppercase; letter-spacing: 0.09em;
          margin: 0 0 8px 8px;
        }
        .sb-recent-item {
          display: block; width: 100%; text-align: left;
          padding: 9px 12px; background: none; border: none;
          border-radius: 10px; font-size: 13px; color: #444;
          font-family: 'Inter', sans-serif; cursor: pointer;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: background 0.15s; margin-bottom: 1px;
        }
        .sb-recent-item:hover { background: #F5F5F5; }

        /* ── Main ── */
        .cr-main {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; min-width: 0;
        }

        .cr-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          border-bottom: 1px solid #EBEBEB;
          flex-shrink: 0; background: #fff;
        }
        .cr-hamburger {
          width: 40px; height: 40px; border-radius: 12px;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #1a1a1a; transition: background 0.15s;
        }
        .cr-hamburger:hover { background: #F5F5F5; }
        .cr-title { font-size: 17px; font-weight: 700; margin: 0; }

        /* Messages area */
        .cr-messages {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column;
        }

        /* Empty / suggestions */
        .cr-empty {
          flex: 1; display: flex; flex-direction: column;
          justify-content: flex-end; padding: 16px;
        }
        .cr-suggestions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .sug-card {
          background: #8A0F29; border: none; border-radius: 18px;
          padding: 15px 13px; cursor: pointer; text-align: left;
          display: flex; flex-direction: column; gap: 5px;
          transition: all 0.2s ease; box-shadow: 0 2px 0 rgba(0,0,0,0.1);
        }
        .sug-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(138,15,41,0.32); }
        .sug-card:active { transform: translateY(0); }
        .sug-title { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.35; }
        .sug-sub { font-size: 11px; color: rgba(255,255,255,0.65); line-height: 1.4; }

        /* Message list */
        .msg-list {
          padding: 16px 14px 8px;
          display: flex; flex-direction: column;
        }

        .msg-row {
          display: flex; margin-bottom: 10px;
          animation: msgIn 0.28s ease;
        }
        .msg-row--user { justify-content: flex-end; }
        .msg-row--ai   { justify-content: flex-start; }

        .bubble-user {
          background: #8A0F29; color: #fff;
          padding: 11px 17px;
          border-radius: 22px 22px 5px 22px;
          max-width: 76%;
          font-size: 14px; font-weight: 500; line-height: 1.5;
        }

        .bubble-ai {
          background: #fff; border: 1px solid #EBEBEB;
          border-radius: 5px 22px 22px 22px;
          padding: 14px 16px;
          max-width: 86%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .bubble-ai-text {
          margin: 0; font-size: 14px; color: #1a1a1a; line-height: 1.65;
        }

        .bubble-ai-meta {
          border-top: 1px solid #F0F0F0;
          margin-top: 11px; padding-top: 9px;
          font-size: 12px; color: #666;
        }
        .meta-label { color: #AAA; }
        .meta-link {
          background: none; border: none; padding: 0;
          font-size: 12px; font-weight: 600; color: #8A0F29;
          font-family: 'Inter', sans-serif;
          cursor: pointer; text-decoration: underline;
        }
        .meta-link:hover { color: #C0254A; }
        .meta-updated { margin-top: 3px; }

        /* Typing */
        .bubble-ai--typing {
          display: flex; align-items: center; gap: 5px;
          padding: 14px 18px;
          border-radius: 5px 22px 22px 22px;
        }
        .td {
          display: inline-block;
          width: 7px; height: 7px; border-radius: 50%;
          background: #8A0F29;
          animation: tdPulse 1.1s ease infinite;
        }

        /* Input */
        .cr-input-wrap {
          padding: 10px 14px 18px;
          border-top: 1px solid #EBEBEB;
          background: #fff; flex-shrink: 0;
        }
        .cr-input-bar {
          display: flex; align-items: center; gap: 8px;
          background: #F5F5F5; border-radius: 28px;
          padding: 7px 7px 7px 17px;
          border: 1.5px solid transparent;
          transition: border-color 0.2s, background 0.2s;
        }
        .cr-input-bar:focus-within {
          border-color: rgba(138,15,41,0.28);
          background: #FAFAFA;
        }
        .cr-input {
          flex: 1; border: none; background: transparent;
          font-size: 14px; outline: none; color: #1a1a1a;
          font-family: 'Inter', sans-serif; padding: 5px 0;
        }
        .cr-input::placeholder { color: #B0B0B0; }

        .cr-send {
          width: 36px; height: 36px; border-radius: 50%;
          border: none; background: #E0E0E0; color: #AAA;
          display: flex; align-items: center; justify-content: center;
          cursor: default; flex-shrink: 0; transition: all 0.2s;
        }
        .cr-send--active {
          background: #8A0F29; color: #fff; cursor: pointer;
          box-shadow: 0 3px 12px rgba(138,15,41,0.35);
        }
        .cr-send--active:hover { background: #9e1230; transform: scale(1.06); }

        /* Animations */
        @keyframes msgIn   { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:none} }
        @keyframes tdPulse { 0%,100%{opacity:.25;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }

        /* Scrollbars */
        .cr-messages::-webkit-scrollbar,
        .sb-recent::-webkit-scrollbar { width: 4px; }
        .cr-messages::-webkit-scrollbar-track,
        .sb-recent::-webkit-scrollbar-track { background: transparent; }
        .cr-messages::-webkit-scrollbar-thumb,
        .sb-recent::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 10px; }

        /* ──────── RESPONSIVE ──────── */

        /* Mobile: sidebar = drawer */
        @media (max-width: 767px) {
          .cr-overlay { display: block; }
          .cr-sidebar {
            position: fixed; top: 0; left: 0; height: 100%;
            max-width: 82vw;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
            box-shadow: 4px 0 32px rgba(0,0,0,0.14);
          }
          .cr-sidebar.is-open { transform: translateX(0); }
          .cr-suggestions { grid-template-columns: 1fr 1fr; }
          .bubble-user { max-width: 82%; }
          .bubble-ai   { max-width: 90%; }
        }

        /* Tablet+ */
        @media (min-width: 768px) {
          .cr-hamburger { display: none; }
          .cr-sidebar.is-open { transform: none !important; }
          .cr-header { padding: 14px 24px; }
          .msg-list  { padding: 24px; max-width: 820px; width: 100%; margin: 0 auto; }
          .cr-empty  { padding: 24px; }
          .cr-input-wrap { padding: 14px 24px 24px; }
          .cr-input-bar  { max-width: 820px; margin: 0 auto; }
          .bubble-user { max-width: 65%; }
          .bubble-ai   { max-width: 78%; }
        }

        /* Large desktop */
        @media (min-width: 1280px) {
          .cr-sidebar { width: 300px; }
        }
      `}</style>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const IconLibrary = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A0F29" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <polyline points="9 2 9 22" />
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A0F29" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);