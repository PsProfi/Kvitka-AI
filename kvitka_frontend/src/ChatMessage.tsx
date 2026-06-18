import { COLORS } from "./colors";
import type { Message } from "./types";

interface ChatMessageProps {
  msg: Message;
  isNew: boolean;
}

export function ChatMessage({ msg, isNew }: ChatMessageProps) {
  const isAssistant = msg.role === "assistant";
  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 20, justifyContent: isAssistant ? "flex-start" : "flex-end",
      animation: isNew ? "fadeIn 0.3s ease" : "none",
    }}>
      {isAssistant && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>К</div>
      )}
      <div style={{
        maxWidth: "70%", padding: "12px 16px", borderRadius: isAssistant ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isAssistant ? COLORS.white : `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`,
        color: isAssistant ? COLORS.gray800 : "#fff",
        boxShadow: isAssistant ? "0 2px 8px rgba(0,0,0,0.08)" : "0 4px 16px rgba(227,30,36,0.25)",
        fontSize: 14, lineHeight: 1.6,
        border: isAssistant ? `1px solid ${COLORS.gray100}` : "none",
      }}>
        {msg.content}
      </div>
      {!isAssistant && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.navy, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>В</div>
      )}
    </div>
  );
}
