import { useState, useEffect, useRef } from "react";
import { COLORS } from "./colors";
import { INITIAL_MESSAGES, SUGGESTIONS } from "./data";
import { getResponse } from "./chatResponses";
import type { Message } from "./types";
import { Logo } from "./Logo";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

interface ChatPageProps {
  onLogout: () => void;
}

export function ChatPage({ onLogout }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState<string>("");
  const [typing, setTyping] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [newMsgIdx, setNewMsgIdx] = useState<number>(-1);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(m => [...m, userMsg]);
    setNewMsgIdx(messages.length);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const resp: Message = { role: "assistant", content: getResponse(text) };
      setMessages(m => { setNewMsgIdx(m.length); return [...m, resp]; });
    }, 1200 + Math.random() * 600);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CONVERSATIONS: string[] = ["Генератори для дачі", "Акумуляторна дриль Bosch", "Знижки на садову техніку", "Зварювальне обладнання"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: COLORS.bg }}>
      {/* Top Nav */}
      <header style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.gray200}`, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ padding: "8px 16px", background: COLORS.red, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            ☰ {sidebarOpen ? "Приховати" : "Показати"} чати
          </button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Logo size={40} />
          </div>
          <div ref={profileRef} style={{ position: "relative" }}>
            <div onClick={() => setProfileOpen(o => !o)} style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>В</div>
            {profileOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 150, overflow: "hidden", zIndex: 200, animation: "fadeIn 0.15s ease" }}>
                <div onClick={() => { setProfileOpen(false); onLogout(); }} style={{ padding: "10px 16px", fontSize: 13, color: COLORS.gray800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = COLORS.gray100)}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "transparent")}>
                  🚪 Вийти
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? 280 : 0, overflow: "hidden", background: COLORS.white, borderRight: `1px solid ${COLORS.gray200}`,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0,
        }}>
          <div style={{ padding: 16, minWidth: 280 }}>
            <button onClick={() => setMessages(INITIAL_MESSAGES)} style={{ width: "100%", padding: "12px 16px", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 20, boxShadow: "0 4px 12px rgba(227,30,36,0.3)" }}>
              + Новий чат
            </button>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Попередні чати</div>
            {CONVERSATIONS.map((c, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: i === 0 ? COLORS.gray100 : "transparent", color: COLORS.gray800, fontSize: 13, animation: `slideIn 0.3s ease ${i * 0.05}s both`, transition: "background 0.15s" }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = COLORS.gray100)}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = i === 0 ? COLORS.gray100 : "transparent")}>
                💬 {c}
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
            {messages.length === 1 && (
              <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeIn 0.5s ease" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>Як можу допомогти?</div>
                <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 24 }}>Запитайте про товари, ціни, доставку або знижки</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)} style={{ padding: "10px 18px", background: COLORS.white, border: `1.5px solid ${COLORS.gray200}`, borderRadius: 20, cursor: "pointer", fontSize: 13, color: COLORS.navy, fontWeight: 500, transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = COLORS.red; e.currentTarget.style.color = COLORS.red; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = COLORS.gray200; e.currentTarget.style.color = COLORS.navy; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} isNew={i === newMsgIdx} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 32px 24px", background: COLORS.white, borderTop: `1px solid ${COLORS.gray200}` }}>
            <div style={{ display: "flex", gap: 12, maxWidth: 900, margin: "0 auto", background: COLORS.bg, borderRadius: 14, padding: "8px 8px 8px 20px", border: `1.5px solid ${COLORS.gray200}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "border-color 0.2s" }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = COLORS.red)}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = COLORS.gray200)}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Напишіть ваше запитання..."
                style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, outline: "none", color: COLORS.gray800, resize: "none", padding: "6px 0" }}
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || typing} style={{ padding: "10px 20px", background: input.trim() && !typing ? `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})` : COLORS.gray200, color: input.trim() && !typing ? "#fff" : COLORS.gray400, border: "none", borderRadius: 10, cursor: input.trim() && !typing ? "pointer" : "default", fontWeight: 700, fontSize: 14, transition: "all 0.2s", boxShadow: input.trim() && !typing ? "0 4px 12px rgba(227,30,36,0.3)" : "none" }}>
                ➤
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: COLORS.gray400 }}>КВІТКА Асистент · Відповідає на питання про товари та послуги</div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${COLORS.gray200};border-radius:10px}
      `}</style>
    </div>
  );
}