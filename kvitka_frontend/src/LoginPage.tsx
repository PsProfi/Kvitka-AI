import { useState, useEffect } from "react";
import { COLORS } from "./colors";
import { Logo } from "./Logo";
import { Spinner } from "./Spinner";

interface LoginPageProps {
  onLogin: () => void;
}

type FocusedField = "" | "email" | "password";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [focused, setFocused] = useState<FocusedField>("");
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!email || !password) { setError("Заповніть усі поля"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 50%, #1e3a5f 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* animated bg dots */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 6 + (i % 4) * 6, height: 6 + (i % 4) * 6,
          borderRadius: "50%",
          background: i % 3 === 0 ? COLORS.red : "rgba(255,255,255,0.08)",
          left: `${8 + (i * 7.5) % 85}%`,
          top: `${5 + (i * 11) % 90}%`,
          animation: `float ${3 + (i % 4) * 0.8}s ease-in-out infinite`,
          animationDelay: `${(i * 0.4) % 3}s`,
        }} />
      ))}

      <div style={{
        background: "rgba(255,255,255,0.97)",
        borderRadius: 16, padding: "48px 40px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        position: "relative", zIndex: 1,
        transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.96)",
        opacity: visible ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo size={48} />
          <div style={{ marginTop: 16, color: COLORS.gray600, fontSize: 14 }}>Увійдіть до особистого кабінету</div>
        </div>

        {(["email", "password"] as const).map((field) => {
          const isPass = field === "password";
          return (
            <div key={field} style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.gray600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {isPass ? "Пароль" : "Email"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={isPass ? "password" : "email"}
                  value={isPass ? password : email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => isPass ? setPassword(e.target.value) : setEmail(e.target.value)}
                  onFocus={() => setFocused(field)}
                  onBlur={() => setFocused("")}
                  placeholder={isPass ? "••••••••" : "example@email.com"}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${focused === field ? COLORS.red : COLORS.gray200}`,
                    fontSize: 15, outline: "none", boxSizing: "border-box",
                    background: COLORS.white, color: COLORS.gray800,
                    transition: "border-color 0.2s",
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </div>
          );
        })}

        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fca5a5`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, animation: "shake 0.3s ease" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", background: loading ? COLORS.gray200 : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            color: loading ? COLORS.gray400 : "#fff", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
            letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 16px rgba(227,30,36,0.3)",
            transform: loading ? "scale(0.98)" : "scale(1)",
          }}
        >
          {loading ? <><Spinner /> Входимо...</> : "УВІЙТИ"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: COLORS.gray400 }}>
          <span style={{ cursor: "pointer", color: COLORS.red, fontWeight: 600 }}>Забули пароль?</span>
        </div>

        <div style={{ marginTop: 24, padding: "16px", background: COLORS.gray100, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: COLORS.gray600, marginBottom: 8 }}>Демо-вхід:</div>
          <div style={{ fontSize: 12, color: COLORS.gray800 }}>
            <strong>Email:</strong> demo@kvitka.ua &nbsp;|&nbsp; <strong>Пароль:</strong> demo123
          </div>
          <button onClick={() => { setEmail("demo@kvitka.ua"); setPassword("demo123"); }} style={{ marginTop: 8, padding: "6px 16px", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            Заповнити
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
