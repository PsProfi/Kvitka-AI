import { COLORS } from "./colors";

export function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, animation: "fadeIn 0.3s ease" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>К</div>
      <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: COLORS.white, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: `1px solid ${COLORS.gray100}`, display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.red, display: "inline-block", animation: `pulse 1.2s ease infinite`, animationDelay: `${i * 0.2}s` }} />)}
      </div>
    </div>
  );
}
