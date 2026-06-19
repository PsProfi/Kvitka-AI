import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Logo2light } from "./Logo2";
import { COLORS } from "./colors";
import type { AuthUser } from "./LoginPage";
import {
  createChatSession,
  getChatMessages,
  getChatSessions,
  openChatEvents,
  sendMessage as apiSendMessage,
  type ChatSession,
  type Message as APIMessage,
  type StoredChatMessage,
} from "./api/chat";

interface Source {
  id: number;
  title: string;
  fileName: string;
  similarityPercent: number;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  created_at?: string;
}

interface ChatPageProps {
  user: AuthUser | null;
  onOpenProfile: () => void;
  onOpenLibrary: () => void;
  onOpenAdmin: () => void;
  onOpenDocument: (docTitle: string) => void;
}

const SUGGESTIONS = [
  {
    title: "Коли я зможу взяти відпустку?",
    subtitle: "Швидко знайдіть інформацію про відпочинок.",
  },
  {
    title: "Які вимоги функціонування?",
    subtitle: "Перевірте оновлення, перенесення та важливі оголошення.",
  },
];

const cacheKey = (userId: number, suffix: string) => `kvitka_chat_${userId}_${suffix}`;

function toChatMessage(message: StoredChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources: message.sources || [],
    created_at: message.created_at,
  };
}

function readCache<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function ChatPage({ user, onOpenProfile, onOpenLibrary, onOpenAdmin, onOpenDocument }: ChatPageProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;
  const canUseChat = typeof userId === "number";
  const canManageKnowledge = user?.login?.toLowerCase() === "admin@gmail.com";

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)),
    [sessions]
  );

  const persistSessions = useCallback((next: ChatSession[]) => {
    if (!userId) return;
    localStorage.setItem(cacheKey(userId, "sessions"), JSON.stringify(next));
  }, [userId]);

  const persistMessages = useCallback((sessionId: string, next: ChatMessage[]) => {
    if (!userId || !sessionId) return;
    localStorage.setItem(cacheKey(userId, `messages_${sessionId}`), JSON.stringify(next));
  }, [userId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!userId || !sessionId) return;
    const cached = readCache<ChatMessage[]>(cacheKey(userId, `messages_${sessionId}`), []);
    setMessages(cached);
    setActiveSessionId(sessionId);
    setDrawerOpen(false);

    try {
      const rows = await getChatMessages(sessionId, userId);
      const next = rows.map(toChatMessage);
      setMessages(next);
      persistMessages(sessionId, next);
    } catch {
      setStatus("Не вдалося оновити історію чату");
    }
  }, [persistMessages, userId]);

  const refreshSessions = useCallback(async () => {
    if (!userId) return;
    const cached = readCache<ChatSession[]>(cacheKey(userId, "sessions"), []);
    if (cached.length) {
      setSessions(cached);
      if (!activeSessionId && cached[0]) {
        void loadMessages(cached[0].id);
      }
    }

    try {
      const next = await getChatSessions(userId);
      setSessions(next);
      persistSessions(next);
      if (!activeSessionId && next[0]) {
        void loadMessages(next[0].id);
      }
    } catch {
      setStatus("Працюємо з кешованими чатами. Сервер історії недоступний.");
    }
  }, [activeSessionId, loadMessages, persistSessions, userId]);

  const startNewChat = useCallback(async () => {
    if (!userId) return;
    setMessages([]);
    setInput("");
    setStatus("");

    try {
      const session = await createChatSession(userId);
      const next = [session, ...sessions.filter((item) => item.id !== session.id)];
      setSessions(next);
      persistSessions(next);
      setActiveSessionId(session.id);
      persistMessages(session.id, []);
      setDrawerOpen(false);
    } catch {
      setActiveSessionId("");
      setDrawerOpen(false);
      setStatus("Новий чат буде створено після першого повідомлення");
    }
  }, [persistMessages, persistSessions, sessions, userId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing || !userId) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (activeSessionId) persistMessages(activeSessionId, nextMessages);
    setInput("");
    setTyping(true);
    setStatus("");

    try {
      const payload: APIMessage[] = nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await apiSendMessage(payload, { userId, sessionId: activeSessionId || undefined });
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer || "Не вдалося отримати відповідь від сервера.",
        sources: response.sources || [],
        created_at: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, assistantMsg];
      setActiveSessionId(response.sessionId);
      setMessages(finalMessages);
      persistMessages(response.sessionId, finalMessages);
      void refreshSessions();
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Помилка: не вдалося отримати відповідь від сервера." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (!canUseChat) return;
    void refreshSessions();
  }, [canUseChat, refreshSessions]);

  useEffect(() => {
    if (!userId) return;
    const events = openChatEvents(userId);
    events.addEventListener("chat-message", (event) => {
      const message = JSON.parse((event as MessageEvent).data) as StoredChatMessage;
      if (message.session_id !== activeSessionId) {
        void refreshSessions();
        return;
      }
      setMessages((current) => {
        if (current.some((item) => item.id && item.id === message.id)) return current;
        if (current.some((item) => !item.id && item.role === message.role && item.content === message.content)) {
          const next = current.map((item) =>
            !item.id && item.role === message.role && item.content === message.content
              ? toChatMessage(message)
              : item
          );
          persistMessages(message.session_id, next);
          return next;
        }
        const next = [...current, toChatMessage(message)];
        persistMessages(message.session_id, next);
        return next;
      });
    });
    events.addEventListener("chat-session", () => void refreshSessions());
    return () => events.close();
  }, [activeSessionId, persistMessages, refreshSessions, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const initials = (user?.login ?? "?")
    .split(/[\s@_.-]+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  return (
    <div
      className="cr"
      style={{
        "--color-red": COLORS.red,
        "--color-red-dark": COLORS.redDark,
        "--color-navy": COLORS.navy,
        "--color-bg": COLORS.bg,
        "--color-white": COLORS.white,
        "--color-gray100": COLORS.gray100,
        "--color-gray200": COLORS.gray200,
        "--color-gray400": COLORS.gray400,
        "--color-gray600": COLORS.gray600,
        "--color-gray800": COLORS.gray800,
      } as CSSProperties}
    >
      <div className={`cr-overlay${drawerOpen ? " is-open" : ""}`} onClick={() => setDrawerOpen(false)} />

      <aside className={`cr-sidebar${drawerOpen ? " is-open" : ""}`}>
        <div className="sb-head">
          <Logo2light size={30} />
          <div className="sb-head-right">
            {canManageKnowledge && (
              <button
                className="sb-icon-btn"
                title="Керування знаннями"
                aria-label="Керування знаннями"
                onClick={() => { setDrawerOpen(false); onOpenAdmin(); }}
              >
                <IconSettings />
              </button>
            )}
            <div className="sb-avatar" onClick={() => { setDrawerOpen(false); onOpenProfile(); }} title={user?.login ?? ""}>
              {initials}
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <button className="sb-nav-item" onClick={startNewChat}>
            <IconPlus />
            <span>Новий чат</span>
          </button>
        </nav>

        <div className="sb-recent">
          <p className="sb-section-label">Нещодавні</p>
          {sortedSessions.length === 0 ? (
            <p className="sb-empty">Поки немає збережених чатів</p>
          ) : (
            sortedSessions.map((session) => (
              <button
                key={session.id}
                className={`sb-recent-item${session.id === activeSessionId ? " is-active" : ""}`}
                onClick={() => loadMessages(session.id)}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="cr-main">
        <header className="cr-header">
          <button className="cr-hamburger" onClick={() => setDrawerOpen((open) => !open)} aria-label="Меню">
            <IconMenu />
          </button>
          <h1 className="cr-title">Чат</h1>
          <div style={{ width: 40 }} />
        </header>

        <div className="cr-messages">
          {status && <div className="cr-status">{status}</div>}
          {messages.length === 0 && !typing ? (
            <div className="cr-empty">
              <div className="cr-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion.title} className="sug-card" onClick={() => sendMessage(suggestion.title)}>
                    <span className="sug-title">{suggestion.title}</span>
                    <span className="sug-sub">{suggestion.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="msg-list">
              {messages.map((message, index) => (
                <div key={message.id || `${message.role}-${index}`} className={`msg-row ${message.role === "user" ? "msg-row--user" : "msg-row--ai"}`}>
                  {message.role === "user" ? (
                    <div className="bubble-user">{message.content}</div>
                  ) : (
                    <div className="bubble-ai">
                      <p className="bubble-ai-text">{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="bubble-ai-meta">
                          <span className="meta-label">Джерела:</span>
                          <div className="meta-source-list">
                            {message.sources.map((source) => (
                              <button key={source.id} className="meta-link" onClick={() => onOpenDocument(source.title)}>
                                {source.title} ({source.similarityPercent}%)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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

        <div className="cr-input-wrap">
          <div className="cr-input-bar">
            <input
              className="cr-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && sendMessage(input)}
              placeholder={canUseChat ? "Запитайте щось..." : "Увійдіть, щоб користуватися чатом"}
              disabled={!canUseChat}
            />
            <button
              className={`cr-send${input.trim() && !typing && canUseChat ? " cr-send--active" : ""}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing || !canUseChat}
              aria-label="Надіслати"
            >
              <IconSend />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .cr { display: flex; height: 100vh; height: 100dvh; background: var(--color-bg); font-family: 'Inter', sans-serif; overflow: hidden; color: var(--color-gray800); }
        .cr-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0); z-index: 150; transition: background 0.25s ease; pointer-events: none; }
        .cr-overlay.is-open { pointer-events: auto; background: rgba(0,0,0,0.42); backdrop-filter: blur(3px); }
        .cr-sidebar { width: 280px; flex-shrink: 0; background: var(--color-white); border-right: 1px solid var(--color-gray200); display: flex; flex-direction: column; overflow: hidden; z-index: 200; }
        .sb-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 18px 14px; border-bottom: 1px solid var(--color-gray200); flex-shrink: 0; }
        .sb-head-right { display: flex; align-items: center; gap: 8px; }
        .sb-icon-btn { width: 32px; height: 32px; background: none; border: none; cursor: pointer; color: var(--color-red); display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background 0.15s; }
        .sb-icon-btn:hover { background: var(--color-gray100); }
        .sb-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--color-red-dark); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-size: 11px; font-weight: 800; cursor: pointer; transition: transform 0.2s; flex-shrink: 0; }
        .sb-avatar:hover { transform: scale(1.08); }
        .sb-nav { border-bottom: 1px solid var(--color-gray200); }
        .sb-nav-item { display: flex; align-items: center; gap: 11px; padding: 13px 18px; width: 100%; background: none; border: none; border-bottom: 1px solid var(--color-gray100); font-size: 14px; font-weight: 500; color: var(--color-gray800); cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
        .sb-nav-item:hover { background: var(--color-gray100); }
        .sb-recent { flex: 1; overflow-y: auto; padding: 14px 10px; }
        .sb-section-label { font-size: 10px; font-weight: 700; color: var(--color-gray400); text-transform: uppercase; letter-spacing: 0.09em; margin: 0 0 8px 8px; }
        .sb-empty { margin: 8px; color: var(--color-gray400); font-size: 13px; line-height: 1.45; }
        .sb-recent-item { display: block; width: 100%; text-align: left; padding: 9px 12px; background: none; border: none; border-radius: 8px; font-size: 13px; color: var(--color-gray600); font-family: 'Inter', sans-serif; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background 0.15s, color 0.15s; margin-bottom: 1px; }
        .sb-recent-item:hover, .sb-recent-item.is-active { background: var(--color-gray100); color: var(--color-gray800); }
        .cr-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .cr-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid var(--color-gray200); flex-shrink: 0; background: var(--color-white); }
        .cr-hamburger { width: 40px; height: 40px; border-radius: 8px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-gray800); transition: background 0.15s; }
        .cr-hamburger:hover { background: var(--color-gray100); }
        .cr-title { font-size: 17px; font-weight: 700; margin: 0; }
        .cr-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .cr-status { max-width: 820px; margin: 14px auto 0; width: calc(100% - 32px); background: #fff6df; border: 1px solid #f2d28c; color: #6f5211; border-radius: 8px; padding: 10px 12px; font-size: 13px; box-sizing: border-box; }
        .cr-empty { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; }
        .cr-suggestions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sug-card { background: var(--color-red-dark); border: none; border-radius: 8px; padding: 15px 13px; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 5px; transition: all 0.2s ease; box-shadow: 0 2px 0 rgba(0,0,0,0.1); }
        .sug-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(138,15,41,0.28); }
        .sug-title { font-size: 13px; font-weight: 700; color: var(--color-white); line-height: 1.35; }
        .sug-sub { font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.4; }
        .msg-list { padding: 16px 14px 8px; display: flex; flex-direction: column; }
        .msg-row { display: flex; margin-bottom: 10px; animation: msgIn 0.28s ease; }
        .msg-row--user { justify-content: flex-end; }
        .msg-row--ai { justify-content: flex-start; }
        .bubble-user { background: var(--color-red); color: var(--color-white); padding: 11px 17px; border-radius: 20px 20px 5px 20px; max-width: 76%; font-size: 14px; font-weight: 500; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
        .bubble-ai { background: var(--color-white); border: 1px solid var(--color-gray100); border-radius: 5px 20px 20px 20px; padding: 14px 16px; max-width: 86%; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .bubble-ai-text { margin: 0; font-size: 14px; color: var(--color-gray800); line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
        .bubble-ai-meta { border-top: 1px solid var(--color-gray100); margin-top: 11px; padding-top: 9px; font-size: 12px; color: var(--color-gray600); }
        .meta-label { color: var(--color-gray400); }
        .meta-source-list { margin-top: 8px; display: grid; gap: 6px; }
        .meta-link { background: none; border: none; padding: 0; font-size: 12px; font-weight: 600; color: var(--color-red); font-family: 'Inter', sans-serif; cursor: pointer; text-decoration: underline; text-align: left; }
        .bubble-ai--typing { display: flex; align-items: center; gap: 5px; padding: 14px 18px; }
        .td { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--color-red); animation: tdPulse 1.1s ease infinite; }
        .cr-input-wrap { padding: 10px 14px 18px; border-top: 1px solid #EBEBEB; background: #fff; flex-shrink: 0; }
        .cr-input-bar { display: flex; align-items: center; gap: 8px; background: var(--color-gray100); border-radius: 28px; padding: 7px 7px 7px 17px; border: 1.5px solid transparent; transition: border-color 0.2s, background 0.2s; }
        .cr-input-bar:focus-within { border-color: rgba(138,15,41,0.28); background: var(--color-white); }
        .cr-input { flex: 1; border: none; background: transparent; font-size: 14px; outline: none; color: #1a1a1a; font-family: 'Inter', sans-serif; padding: 5px 0; min-width: 0; }
        .cr-input::placeholder { color: var(--color-gray400); }
        .cr-send { width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--color-gray200); color: var(--color-gray400); display: flex; align-items: center; justify-content: center; cursor: default; flex-shrink: 0; transition: all 0.2s; }
        .cr-send--active { background: var(--color-red); color: var(--color-white); cursor: pointer; box-shadow: 0 3px 12px rgba(138,15,41,0.35); }
        .cr-send--active:hover { background: var(--color-red-dark); transform: scale(1.06); }
        @keyframes msgIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
        @keyframes tdPulse { 0%,100% { opacity: .25; transform: scale(.75); } 50% { opacity: 1; transform: scale(1); } }
        .cr-messages::-webkit-scrollbar, .sb-recent::-webkit-scrollbar { width: 4px; }
        .cr-messages::-webkit-scrollbar-thumb, .sb-recent::-webkit-scrollbar-thumb { background: var(--color-gray200); border-radius: 10px; }
        @media (max-width: 767px) {
          .cr-overlay { display: block; }
          .cr-sidebar { position: fixed; top: 0; left: 0; height: 100%; max-width: 82vw; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow: 4px 0 32px rgba(0,0,0,0.14); }
          .cr-sidebar.is-open { transform: translateX(0); }
          .bubble-user { max-width: 82%; }
          .bubble-ai { max-width: 90%; }
        }
        @media (min-width: 768px) {
          .cr-hamburger { display: none; }
          .cr-sidebar.is-open { transform: none !important; }
          .cr-header { padding: 14px 24px; }
          .msg-list { padding: 24px; max-width: 820px; width: 100%; margin: 0 auto; }
          .cr-empty { padding: 24px; }
          .cr-input-wrap { padding: 14px 24px 24px; }
          .cr-input-bar { max-width: 820px; margin: 0 auto; }
          .bubble-user { max-width: 65%; }
          .bubble-ai { max-width: 78%; }
        }
      `}</style>
    </div>
  );
}

const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const IconLibrary = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <polyline points="9 2 9 22" />
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 2l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1.7 1.7 0 0 0-2 .3l-.7.7a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.7-.7a1.7 1.7 0 0 0 .3-2l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1.7 1.7 0 0 0 2-.3l.7-.7a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.7.7Z" />
  </svg>
);

const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
