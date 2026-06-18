import { useState, useEffect } from "react";
import { Logo } from "./Logo";

export interface AuthUser {
  id: number;
  login: string;
  is_admin: boolean;
  access_token: string;
}

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Заповніть усі поля");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          response.status === 401
            ? "Невірний логін або пароль"
            : data.detail || "Помилка сервера. Спробуйте ще раз.";
        setError(message);
        return;
      }

      const user: AuthUser = await response.json();
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("auth_token", user.access_token);
      storage.setItem("auth_user", JSON.stringify({ id: user.id, login: user.login, is_admin: user.is_admin }));

      onLogin(user);
    } catch {
      setError("Не вдалося з'єднатися з сервером. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 30%, #8A0F29 0%, #300007 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "24px 16px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle Grid Overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* Main Container with slide-in animation */}
      <div style={{
        width: "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
        zIndex: 1,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {/* Header Section (Outside Card, Left-aligned) */}
        <div style={{ paddingLeft: "4px", marginBottom: "28px" }}>
          {/* Logo */}
          <div style={{ marginBottom: "20px" }}>
            <Logo size={52} light />
          </div>

          {/* Heading */}
          <h1 style={{
            color: "#FFFFFF",
            fontSize: "32px",
            fontWeight: 800,
            margin: 0,
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
          }}>
            Вітаю!<br />
            Увійдіть до<br />
            свого акаунта
          </h1>

          {/* Subtitle */}
          <p style={{
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "14px",
            margin: "10px 0 0 0",
            lineHeight: "1.5",
          }}>
            Введіть свою електронну адресу та пароль для входу.
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {/* Email Input Block */}
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#4B5563",
              marginBottom: "8px",
              fontWeight: 500
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Loisbecket@gmail.com"
              className="login-input"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Password Input Block */}
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#4B5563",
              marginBottom: "8px",
              fontWeight: 500
            }}>
              Пароль
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                style={{ paddingRight: "46px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  outline: "none",
                  transition: "color 0.2s",
                }}
                className="eye-toggle"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Checkbox and Forgot Password Link */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "4px"
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#4B5563",
              cursor: "pointer",
              userSelect: "none"
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  border: "1.5px solid #D1D5DB",
                  accentColor: "#801229",
                  cursor: "pointer",
                }}
              />
              <span>Запам'ятати мене</span>
            </label>
            <a
              href="#forgot"
              onClick={(e) => e.preventDefault()}
              style={{
                fontSize: "13px",
                color: "#2563EB",
                textDecoration: "none",
                fontWeight: 600,
              }}
              className="forgot-link"
            >
              Забули пароль?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#DC2626",
              fontSize: "13px",
              animation: "shake 0.3s ease",
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <>
                <WhiteSpinner />
                <span>Входимо...</span>
              </>
            ) : (
              "Log In"
            )}
          </button>

          {/* Demo Login Credentials Block */}
          <div style={{
            marginTop: "12px",
            padding: "16px",
            background: "#F9FAFB",
            borderRadius: "12px",
            border: "1px dashed #E5E7EB",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Демо-вхід
            </div>
            <div style={{ fontSize: "12px", color: "#374151", marginBottom: "12px" }}>
              <strong>Email:</strong> demo@kvitka.ua &nbsp;|&nbsp; <strong>Пароль:</strong> demo123
            </div>
            <button
              onClick={() => {
                setEmail("demo@kvitka.ua");
                setPassword("demo123");
              }}
              className="demo-btn"
            >
              Заповнити автоматично
            </button>
          </div>
        </div>
      </div>

      {/* Styled classes block */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          background-color: #FFFFFF;
          color: #1F2937;
          transition: all 0.2s ease-in-out;
          font-family: 'Inter', sans-serif;
        }
        .login-input::placeholder {
          color: #9CA3AF;
        }
        .login-input:focus {
          border-color: #801229;
          box-shadow: 0 0 0 4px rgba(128, 18, 41, 0.12);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background-color: #801229;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 12px rgba(128, 18, 41, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
        }
        .login-btn:hover {
          background-color: #991B32;
          box-shadow: 0 6px 16px rgba(128, 18, 41, 0.25);
          transform: translateY(-1px);
        }
        .login-btn:active {
          transform: translateY(0);
        }
        .login-btn:disabled {
          background-color: #E5E7EB;
          color: #9CA3AF;
          cursor: default;
          box-shadow: none;
          transform: none;
        }

        .forgot-link:hover {
          text-decoration: underline !important;
        }

        .eye-toggle:hover {
          color: #4B5563 !important;
        }

        .demo-btn {
          padding: 8px 16px;
          background-color: #801229;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-family: 'Inter', sans-serif;
        }
        .demo-btn:hover {
          background-color: #991B32;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// Inline SVGs for Password Visibility Toggle
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const WhiteSpinner = () => (
  <span style={{
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.35)",
    borderTop: "2px solid #FFFFFF",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  }} />
);
