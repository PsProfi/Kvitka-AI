import { useState } from "react";
import type { AuthUser } from "./LoginPage";

interface ProfilePageProps {
  user: AuthUser | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ProfilePage({ user, onBack, onLogout }: ProfilePageProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = (user?.login ?? "?")
    .split(/[\s@_.-]+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  const handlePasswordChange = () => {
    setPwError("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError("Заповніть усі поля");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Паролі не збігаються");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Пароль має бути не менше 6 символів");
      return;
    }
    setPwSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwSuccess(false);
    }, 1800);
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setPwError("");
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  return (
    <div className="prof-root">
      {/* Background decorations */}
      <div className="prof-grid" />
      <div className="prof-blob" />

      <div className="prof-container">
        {/* Back button */}
        <div className="prof-topbar">
          <button className="prof-back-btn" onClick={onBack} aria-label="Назад">
            <BackIcon />
          </button>
        </div>

        {/* Avatar + username */}
        <div className="prof-hero">
          <div className="prof-avatar">{initials}</div>
          <p className="prof-username">{user?.login ?? "Гість"}</p>
        </div>

        {/* Cards */}
        <div className="prof-cards">
          {/* Email */}
          <div className="prof-card">
            <div className="prof-card-icon">
              <EmailIcon />
            </div>
            <div className="prof-card-body">
              <span className="prof-card-label">Адреса електронної пошти</span>
              <span className="prof-card-value">{user?.login ?? "—"}</span>
            </div>
          </div>

          {/* Password */}
          <button
            className="prof-card prof-card--btn"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="prof-card-icon">
              <KeyIcon />
            </div>
            <div className="prof-card-body">
              <span className="prof-card-label">Пароль</span>
              <span className="prof-card-value">••••••••</span>
            </div>
            <ChevronIcon />
          </button>

          {/* Logout */}
          <button
            className="prof-card prof-card--btn prof-card--logout"
            onClick={onLogout}
          >
            <div className="prof-card-icon prof-card-icon--logout">
              <LogoutIcon />
            </div>
            <div className="prof-card-body" style={{ flex: 1 }}>
              <span className="prof-card-value" style={{ color: "#FF6B6B" }}>Вийти</span>
            </div>
            <ChevronIcon color="#FF6B6B" />
          </button>
        </div>
      </div>

      {/* Password modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Змінити пароль</h2>
            <p className="modal-subtitle">Введіть поточний та новий пароль</p>

            {pwSuccess ? (
              <div className="modal-success">
                <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
                <div style={{ color: "#4ade80", fontSize: 15, fontWeight: 600 }}>
                  Пароль успішно змінено!
                </div>
              </div>
            ) : (
              <>
                <div className="modal-fields">
                  <PwField label="Поточний пароль" value={oldPassword} onChange={setOldPassword} show={showOld} onToggle={() => setShowOld(s => !s)} />
                  <PwField label="Новий пароль" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(s => !s)} />
                  <PwField label="Підтвердити пароль" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(s => !s)} onEnter={handlePasswordChange} />
                </div>
                {pwError && <div className="modal-error">⚠ {pwError}</div>}
                <div className="modal-actions">
                  <button className="modal-btn modal-btn--cancel" onClick={closeModal}>Скасувати</button>
                  <button className="modal-btn modal-btn--confirm" onClick={handlePasswordChange}>Зберегти</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .prof-root {
          min-height: 100vh; min-height: 100dvh;
          background: radial-gradient(ellipse at 50% 0%, #8A0F29 0%, #300007 60%, #1a0003 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex; flex-direction: column; align-items: center;
          position: relative; overflow: hidden;
        }
        .prof-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 32px 32px; pointer-events: none;
        }
        .prof-blob {
          position: fixed; top: -120px; left: 50%; transform: translateX(-50%);
          width: 500px; height: 400px;
          background: radial-gradient(circle, rgba(200,30,60,0.35) 0%, transparent 70%);
          pointer-events: none;
        }

        .prof-container {
          width: 100%; max-width: 520px;
          padding: 0 16px 48px;
          box-sizing: border-box;
          position: relative; z-index: 1;
        }

        .prof-topbar { padding: 18px 0 4px; }

        .prof-back-btn {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: all 0.2s;
        }
        .prof-back-btn:hover { background: rgba(255,255,255,0.18); transform: translateX(-2px); }

        .prof-hero {
          display: flex; flex-direction: column; align-items: center;
          padding: 28px 0 36px; gap: 12px;
        }
        .prof-avatar {
          width: 86px; height: 86px; border-radius: 50%;
          background: linear-gradient(135deg, #8A0F29, #C0254A);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; font-weight: 800; color: #fff;
          border: 3px solid rgba(255,255,255,0.22);
          box-shadow: 0 8px 32px rgba(138,15,41,0.5);
          letter-spacing: -0.5px;
        }
        .prof-username {
          margin: 0; font-size: 15px; font-weight: 500;
          color: rgba(255,255,255,0.65); letter-spacing: 0.01em;
        }

        .prof-cards { display: flex; flex-direction: column; gap: 10px; }

        .prof-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .prof-card--btn {
          width: 100%; cursor: pointer;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'Inter', sans-serif;
        }
        .prof-card--btn:hover { background: rgba(255,255,255,0.12) !important; transform: translateX(3px); }
        .prof-card--logout:hover { background: rgba(255,107,107,0.1) !important; border-color: rgba(255,107,107,0.25) !important; }

        .prof-card-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: rgba(255,255,255,0.7);
        }
        .prof-card-icon--logout { background: rgba(255,107,107,0.12); color: #FF6B6B; }

        .prof-card-body {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 2px; text-align: left;
        }
        .prof-card-label {
          font-size: 11px; color: rgba(255,255,255,0.42);
          font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .prof-card-value {
          font-size: 14px; color: rgba(255,255,255,0.88);
          font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px; box-sizing: border-box;
        }
        .modal-box {
          background: linear-gradient(160deg, #1a0003 0%, #300007 100%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px; padding: 30px 26px;
          width: 100%; max-width: 390px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .modal-title { margin: 0 0 5px; color: #fff; font-size: 20px; font-weight: 700; }
        .modal-subtitle { margin: 0 0 22px; color: rgba(255,255,255,0.45); font-size: 13px; }
        .modal-fields { display: flex; flex-direction: column; gap: 13px; }
        .modal-success { text-align: center; padding: 20px 0; }
        .modal-error {
          margin-top: 13px; padding: 10px 14px;
          background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
          border-radius: 10px; color: #FF6B6B; font-size: 13px;
        }
        .modal-actions { display: flex; gap: 10px; margin-top: 22px; }
        .modal-btn {
          flex: 1; padding: 13px; border-radius: 12px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .modal-btn--cancel {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
        }
        .modal-btn--cancel:hover { background: rgba(255,255,255,0.13) !important; }
        .modal-btn--confirm {
          background: linear-gradient(135deg, #8A0F29, #C0254A); border: none; color: #fff;
          box-shadow: 0 4px 16px rgba(138,15,41,0.4);
        }
        .modal-btn--confirm:hover { background: linear-gradient(135deg, #9e1230, #d12a52) !important; transform: translateY(-1px); }

        .pw-input-wrap { position: relative; }
        .pw-input {
          width: 100%; padding: 12px 44px 12px 14px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px; color: #fff; font-size: 14px;
          outline: none; box-sizing: border-box; font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .pw-input::placeholder { color: rgba(255,255,255,0.28); }
        .pw-input:focus { border-color: rgba(200,40,70,0.7); box-shadow: 0 0 0 3px rgba(138,15,41,0.25); }
        .pw-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); display: flex; align-items: center;
          padding: 4px; outline: none; transition: color 0.15s;
        }
        .pw-eye:hover { color: rgba(255,255,255,0.7) !important; }

        .pw-label {
          display: block; font-size: 12px; color: rgba(255,255,255,0.45);
          font-weight: 500; margin-bottom: 6px; letter-spacing: 0.04em;
        }

        @keyframes modalIn {
          from { opacity:0; transform: scale(0.92) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }

        @media (min-width: 640px) {
          .prof-card { padding: 18px 22px; }
          .prof-card-icon { width: 46px; height: 46px; border-radius: 14px; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-component: password field ─────────────────────────────────────────
interface PwFieldProps {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; onEnter?: () => void;
}
function PwField({ label, value, onChange, show, onToggle, onEnter }: PwFieldProps) {
  return (
    <div>
      <label className="pw-label">{label}</label>
      <div className="pw-input-wrap">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pw-input"
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        />
        <button type="button" onClick={onToggle} className="pw-eye">
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6M15.5 7.5l3 3 3-3m-6 3 3 3" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronIcon = ({ color = "rgba(255,255,255,0.28)" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
