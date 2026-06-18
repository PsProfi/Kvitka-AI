import { useEffect, useState } from "react";
import type { AuthUser } from "./LoginPage";
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

export function AdminPage({ user, onBack }: AdminPageProps) {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setTitle(doc.title);
    setContent(doc.content ?? "");

    if (!doc.content) {
      try {
        const fullDoc = await getDocumentById(doc.id);
        setSelectedDoc(fullDoc);
        setTitle(fullDoc.title);
        setContent(fullDoc.content ?? "");
      } catch (err) {
        setError(String(err));
      }
    }
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Вкажіть заголовок документу");
      return;
    }
    if (!file) {
      setError("Виберіть PDF або TXT файл для завантаження");
      return;
    }

    setSaving(true);
    try {
      await uploadDocument(file, title.trim());
      setTitle("");
      setFile(null);
      setSuccess("Документ завантажено успішно");
      await loadDocuments();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    if (!title.trim()) {
      setError("Заголовок не може бути порожнім");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateDocument(selectedDoc.id, {
        title: title.trim(),
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
    if (!window.confirm("Ви впевнені, що хочете видалити цей документ?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteDocument(selectedDoc.id);
      setSuccess("Документ видалено");
      setSelectedDoc(null);
      setTitle("");
      setContent("");
      await loadDocuments();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-root">
      <header className="admin-header">
        <button className="admin-back" onClick={onBack} aria-label="Назад">←</button>
        <div>
          <p className="admin-label">Адміністрування</p>
          <h1 className="admin-title">Документи та векторизація</h1>
        </div>
        <div className="admin-user">{user?.login}</div>
      </header>

      <div className="admin-body">
        <section className="admin-panel admin-upload">
          <h2>Завантажити документ</h2>
          <label className="admin-field">
            Назва документу
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Введіть назву документу"
            />
          </label>
          <label className="admin-field">
            Файл
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(event) => {
                const chosen = event.target.files?.[0] ?? null;
                setFile(chosen);
              }}
            />
          </label>
          <button className="admin-btn admin-btn--primary" onClick={handleUpload} disabled={saving}>
            {saving ? "Завантаження..." : "Завантажити документ"}
          </button>
          <p className="admin-hint">Після завантаження документ буде розбитий на вектори та збережений у Supabase.</p>
        </section>

        <section className="admin-panel admin-list">
          <div className="admin-section-header">
            <h2>Список документів</h2>
            <button className="admin-btn" onClick={loadDocuments} disabled={loading}>Оновити</button>
          </div>

          {loading ? (
            <p>Завантаження документів...</p>
          ) : documents.length === 0 ? (
            <p>Документів поки немає.</p>
          ) : (
            <div className="admin-docs">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  className={`admin-doc ${selectedDoc?.id === doc.id ? "admin-doc--active" : ""}`}
                  onClick={() => handleSelectDoc(doc)}
                >
                  <span>{doc.title}</span>
                  <small>{new Date(doc.updated_at).toLocaleString("uk-UA")}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-edit">
          <h2>Редагування документа</h2>
          {selectedDoc ? (
            <>
              <label className="admin-field">
                Заголовок
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label className="admin-field admin-field--textarea">
                Вміст документу
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={10}
                  placeholder="Тут можна змінити текст документа або залишити порожнім для збереження тільки заголовка"
                />
              </label>
              <div className="admin-actions">
                <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Збереження..." : "Зберегти зміни"}
                </button>
                <button className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={saving}>
                  Видалити документ
                </button>
              </div>
            </>
          ) : (
            <p>Оберіть документ зі списку, щоб редагувати або видалити його.</p>
          )}
        </section>
      </div>

      {(error || success) && (
        <div className={`admin-toast ${error ? "admin-toast--error" : "admin-toast--success"}`}>
          {error || success}
        </div>
      )}

      <style>{`
        .admin-root { min-height: 100vh; min-height: 100dvh; background: #F7F5F2; color: #1F1F1F; font-family: 'Inter', sans-serif; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 24px 20px 16px; background: #8A0F29; color: #fff; }
        .admin-label { margin: 0 0 4px; font-size: 13px; text-transform: uppercase; opacity: 0.8; }
        .admin-title { margin: 0; font-size: 28px; font-weight: 800; line-height: 1.1; }
        .admin-user { font-size: 13px; opacity: 0.9; }
        .admin-body { display: grid; gap: 18px; padding: 18px 20px 40px; max-width: 1180px; margin: 0 auto; grid-template-columns: 1.2fr 0.9fr; }
        .admin-panel { background: #fff; border-radius: 24px; padding: 22px; box-shadow: 0 20px 48px rgba(15,15,15,0.08); border: 1px solid rgba(0,0,0,0.04); }
        .admin-panel h2 { margin: 0 0 16px; font-size: 18px; font-weight: 700; }
        .admin-field { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; font-size: 14px; }
        .admin-field input, .admin-field textarea { width: 100%; border-radius: 16px; border: 1px solid #d4d4d4; padding: 14px 16px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .admin-field input:focus, .admin-field textarea:focus { border-color: #8A0F29; }
        .admin-field--textarea textarea { min-height: 240px; resize: vertical; }
        .admin-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: 14px; border: none; cursor: pointer; font-weight: 700; font-size: 14px; transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease; }
        .admin-btn:hover { transform: translateY(-1px); }
        .admin-btn--primary { color: #fff; background: #8A0F29; }
        .admin-btn--danger { color: #fff; background: #E45A5A; margin-left: 12px; }
        .admin-section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .admin-docs { display: grid; gap: 12px; }
        .admin-doc { width: 100%; text-align: left; background: #F8F5F0; border: 1px solid transparent; border-radius: 18px; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
        .admin-doc:hover { background: #FFF6F4; }
        .admin-doc--active { border-color: #8A0F29; background: #fff; }
        .admin-doc small { color: #7B7B7B; font-size: 12px; }
        .admin-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
        .admin-hint { margin: 12px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.5; }
        .admin-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 20; padding: 14px 20px; border-radius: 18px; box-shadow: 0 18px 42px rgba(0,0,0,0.14); font-weight: 600; }
        .admin-toast--error { background: #ffe0dd; color: #a72a1f; }
        .admin-toast--success { background: #d8f0e8; color: #1f5c44; }

        @media (max-width: 1024px) { .admin-body { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; } }
      `}</style>
    </div>
  );
}
