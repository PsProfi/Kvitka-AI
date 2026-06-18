import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "./LoginPage";
import { COLORS } from "./colors";
import {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  type AdminDocument,
} from "./api/admin";

interface AdminPageProps {
  user: AuthUser | null;
  onBack: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileLabel(file: File | null) {
  if (!file) return "PDF або TXT";
  const sizeMb = file.size / 1024 / 1024;
  return `${file.name} · ${sizeMb.toFixed(sizeMb >= 1 ? 1 : 2)} MB`;
}

export function AdminPage({ user, onBack }: AdminPageProps) {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = async (doc: AdminDocument) => {
    setError("");
    setSuccess("");
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setContent(doc.content ?? "");

    if (!doc.content) {
      try {
        const fullDoc = await getDocumentById(doc.id);
        setSelectedDoc(fullDoc);
        setEditTitle(fullDoc.title);
        setContent(fullDoc.content ?? "");
      } catch (err) {
        setError(String(err));
      }
    }
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!uploadTitle.trim()) {
      setError("Вкажіть назву документа");
      return;
    }
    if (!file) {
      setError("Виберіть PDF або TXT файл");
      return;
    }

    setSaving(true);
    try {
      await uploadDocument(file, uploadTitle.trim());
      setUploadTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Документ завантажено");
      await loadDocuments();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    if (!editTitle.trim()) {
      setError("Заголовок не може бути порожнім");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateDocument(selectedDoc.id, {
        title: editTitle.trim(),
        content: content.trim() || undefined,
      });
      setSuccess("Зміни збережено");
      await loadDocuments();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    if (!window.confirm("Видалити цей документ?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteDocument(selectedDoc.id);
      setSuccess("Документ видалено");
      setSelectedDoc(null);
      setEditTitle("");
      setContent("");
      await loadDocuments();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedUpdatedAt = selectedDoc ? formatDate(selectedDoc.updated_at) : "";
  const contentLength = content.trim().length;

  return (
    <div className="admin-root">
      <header className="admin-shell admin-topbar">
        <button className="admin-icon-btn" onClick={onBack} aria-label="Назад">
          <IconArrowLeft />
        </button>

        <div className="admin-heading">
          <span className="admin-kicker">Керування знаннями</span>
          <h1>Документи та векторизація</h1>
        </div>

        <div className="admin-user">
          <span className="admin-user-dot" />
          <span>{user?.login || "Адміністратор"}</span>
        </div>
      </header>

      <main className="admin-shell admin-main">
        <section className="admin-summary" aria-label="Статистика">
          <div className="admin-stat">
            <span className="admin-stat-value">{documents.length}</span>
            <span className="admin-stat-label">документів</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{selectedDoc ? "1" : "0"}</span>
            <span className="admin-stat-label">обрано</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{loading ? "..." : "OK"}</span>
            <span className="admin-stat-label">стан бази</span>
          </div>
        </section>

        <section className="admin-layout">
          <div className="admin-column">
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span className="admin-eyebrow">Новий файл</span>
                  <h2>Завантаження</h2>
                </div>
                <IconUpload />
              </div>

              <label className="admin-field">
                <span>Назва документа</span>
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Наприклад, Правила вступу"
                />
              </label>

              <label className="admin-file">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(event) => {
                    const chosen = event.target.files?.[0] ?? null;
                    setFile(chosen);
                  }}
                />
                <span className="admin-file-icon"><IconFile /></span>
                <span className="admin-file-text">
                  <strong>{file ? "Файл обрано" : "Оберіть файл"}</strong>
                  <small>{getFileLabel(file)}</small>
                </span>
              </label>

              <button className="admin-btn admin-btn--primary" onClick={handleUpload} disabled={saving}>
                <IconUpload />
                <span>{saving ? "Завантаження..." : "Завантажити"}</span>
              </button>
            </section>

            <section className="admin-panel admin-list-panel">
              <div className="admin-panel-head">
                <div>
                  <span className="admin-eyebrow">База знань</span>
                  <h2>Документи</h2>
                </div>
                <button className="admin-icon-btn admin-icon-btn--light" onClick={loadDocuments} disabled={loading} aria-label="Оновити">
                  <IconRefresh />
                </button>
              </div>

              {loading ? (
                <div className="admin-state">Завантаження документів...</div>
              ) : documents.length === 0 ? (
                <div className="admin-state">Документів поки немає</div>
              ) : (
                <div className="admin-docs">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      className={`admin-doc ${selectedDoc?.id === doc.id ? "admin-doc--active" : ""}`}
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <span className="admin-doc-title">{doc.title}</span>
                      <span className="admin-doc-meta">
                        <IconClock />
                        {formatDate(doc.updated_at)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="admin-panel admin-editor">
            <div className="admin-panel-head admin-editor-head">
              <div>
                <span className="admin-eyebrow">Редактор</span>
                <h2>{selectedDoc ? "Обраний документ" : "Документ не обрано"}</h2>
              </div>
              {selectedDoc && <span className="admin-pill">{selectedUpdatedAt}</span>}
            </div>

            {selectedDoc ? (
              <>
                <label className="admin-field">
                  <span>Заголовок</span>
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                </label>

                <label className="admin-field admin-field--textarea">
                  <span>Вміст документа</span>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={16}
                    placeholder="Вміст документа з'явиться тут після вибору зі списку"
                  />
                </label>

                <div className="admin-editor-footer">
                  <span>{contentLength.toLocaleString("uk-UA")} символів</span>
                  <div className="admin-actions">
                    <button className="admin-btn admin-btn--ghost" onClick={handleDelete} disabled={saving}>
                      <IconTrash />
                      <span>Видалити</span>
                    </button>
                    <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                      <IconSave />
                      <span>{saving ? "Збереження..." : "Зберегти"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="admin-empty-editor">
                <IconFile />
                <h3>Оберіть документ</h3>
                <p>Вміст і параметри відкриються у редакторі.</p>
              </div>
            )}
          </section>
        </section>
      </main>

      {(error || success) && (
        <div className={`admin-toast ${error ? "admin-toast--error" : "admin-toast--success"}`}>
          {error || success}
        </div>
      )}

      <style>{`
        .admin-root {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            linear-gradient(180deg, rgba(227,30,36,0.08), transparent 260px),
            ${COLORS.bg};
          color: ${COLORS.gray800};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .admin-shell { width: min(1240px, calc(100% - 32px)); margin: 0 auto; }
        .admin-topbar {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          padding: 22px 0 18px;
        }
        .admin-heading { min-width: 0; }
        .admin-kicker, .admin-eyebrow {
          display: block;
          color: ${COLORS.redDark};
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .admin-heading h1 {
          margin: 4px 0 0;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.08;
          font-weight: 850;
        }
        .admin-user {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 0 12px;
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          background: ${COLORS.white};
          color: ${COLORS.gray600};
          font-size: 13px;
          font-weight: 700;
        }
        .admin-user-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${COLORS.red};
          box-shadow: 0 0 0 4px rgba(227,30,36,0.12);
        }
        .admin-icon-btn {
          width: 40px;
          height: 40px;
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          background: ${COLORS.white};
          color: ${COLORS.gray800};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        .admin-icon-btn:hover { border-color: ${COLORS.redDark}; transform: translateY(-1px); }
        .admin-icon-btn:disabled { cursor: default; opacity: 0.55; transform: none; }
        .admin-icon-btn--light { background: ${COLORS.gray100}; }
        .admin-main { padding-bottom: 36px; }
        .admin-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .admin-stat {
          min-height: 74px;
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          background: ${COLORS.white};
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .admin-stat-value { font-size: 26px; line-height: 1; font-weight: 850; color: ${COLORS.redDark}; }
        .admin-stat-label { margin-top: 7px; font-size: 13px; color: ${COLORS.gray600}; }
        .admin-layout {
          display: grid;
          grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.5fr);
          gap: 12px;
          align-items: start;
        }
        .admin-column { display: grid; gap: 12px; }
        .admin-panel {
          background: ${COLORS.white};
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          box-shadow: 0 18px 45px rgba(26, 43, 74, 0.08);
          padding: 18px;
        }
        .admin-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }
        .admin-panel h2 {
          margin: 4px 0 0;
          font-size: 19px;
          line-height: 1.2;
          font-weight: 820;
        }
        .admin-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
          color: ${COLORS.gray600};
          font-size: 13px;
          font-weight: 700;
        }
        .admin-field input,
        .admin-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          background: ${COLORS.white};
          color: ${COLORS.gray800};
          padding: 12px 13px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .admin-field textarea { line-height: 1.55; resize: vertical; min-height: 390px; }
        .admin-field input:focus,
        .admin-field textarea:focus {
          border-color: ${COLORS.redDark};
          box-shadow: 0 0 0 4px rgba(227,30,36,0.1);
        }
        .admin-file {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 66px;
          padding: 12px;
          border: 1px dashed ${COLORS.gray400};
          border-radius: 8px;
          background: ${COLORS.gray100};
          cursor: pointer;
          margin-bottom: 14px;
        }
        .admin-file input { display: none; }
        .admin-file-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: ${COLORS.white};
          color: ${COLORS.redDark};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .admin-file-text { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .admin-file-text strong { color: ${COLORS.gray800}; font-size: 14px; }
        .admin-file-text small {
          color: ${COLORS.gray600};
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }
        .admin-btn {
          min-height: 42px;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        .admin-btn:hover { transform: translateY(-1px); }
        .admin-btn:disabled { opacity: 0.6; cursor: default; transform: none; }
        .admin-btn--primary { width: 100%; background: ${COLORS.redDark}; color: ${COLORS.white}; }
        .admin-btn--primary:hover { background: ${COLORS.red}; }
        .admin-btn--ghost {
          background: ${COLORS.white};
          color: ${COLORS.redDark};
          border-color: rgba(227,30,36,0.28);
        }
        .admin-list-panel { max-height: 560px; display: flex; flex-direction: column; }
        .admin-docs { display: grid; gap: 8px; overflow: auto; padding-right: 2px; }
        .admin-doc {
          width: 100%;
          border: 1px solid ${COLORS.gray200};
          border-radius: 8px;
          background: ${COLORS.white};
          padding: 13px;
          text-align: left;
          display: grid;
          gap: 8px;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        .admin-doc:hover { border-color: rgba(227,30,36,0.45); background: #FFF8F8; transform: translateY(-1px); }
        .admin-doc--active { border-color: ${COLORS.redDark}; background: #FFF4F4; }
        .admin-doc-title {
          color: ${COLORS.gray800};
          font-size: 14px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-doc-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: ${COLORS.gray600};
          font-size: 12px;
        }
        .admin-state {
          min-height: 120px;
          border: 1px dashed ${COLORS.gray200};
          border-radius: 8px;
          color: ${COLORS.gray600};
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
        }
        .admin-editor { min-height: 690px; }
        .admin-editor-head { align-items: center; }
        .admin-pill {
          border-radius: 999px;
          border: 1px solid ${COLORS.gray200};
          color: ${COLORS.gray600};
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }
        .admin-editor-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: ${COLORS.gray600};
          font-size: 13px;
        }
        .admin-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .admin-actions .admin-btn--primary { width: auto; }
        .admin-empty-editor {
          min-height: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: ${COLORS.gray600};
          border: 1px dashed ${COLORS.gray200};
          border-radius: 8px;
          padding: 24px;
        }
        .admin-empty-editor svg { color: ${COLORS.redDark}; margin-bottom: 14px; }
        .admin-empty-editor h3 { margin: 0 0 6px; color: ${COLORS.gray800}; font-size: 18px; }
        .admin-empty-editor p { margin: 0; max-width: 280px; line-height: 1.5; }
        .admin-toast {
          position: fixed;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          z-index: 20;
          max-width: min(520px, calc(100% - 32px));
          padding: 13px 16px;
          border-radius: 8px;
          box-shadow: 0 18px 42px rgba(0,0,0,0.14);
          font-weight: 750;
          font-size: 14px;
        }
        .admin-toast--error { background: #FFE8E8; color: #9D1519; border: 1px solid rgba(227,30,36,0.25); }
        .admin-toast--success { background: #E7F6EF; color: #176246; border: 1px solid rgba(23,98,70,0.16); }
        @media (max-width: 980px) {
          .admin-layout { grid-template-columns: 1fr; }
          .admin-list-panel { max-height: none; }
          .admin-editor { min-height: auto; }
        }
        @media (max-width: 680px) {
          .admin-shell { width: min(100% - 20px, 1240px); }
          .admin-topbar { grid-template-columns: 40px 1fr; }
          .admin-user { grid-column: 1 / -1; justify-self: start; }
          .admin-summary { grid-template-columns: 1fr; }
          .admin-panel { padding: 14px; }
          .admin-editor-footer { align-items: stretch; flex-direction: column; }
          .admin-actions, .admin-actions .admin-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
  </svg>
);

const IconFile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
);

const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 1-15.5 6.2" />
    <path d="M3 12A9 9 0 0 1 18.5 5.8" />
    <path d="M18 2v4h4" />
    <path d="M6 22v-4H2" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconSave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m19 6-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);
