interface LibraryPageProps {
  onBack: () => void;
  onOpenDocument: (docTitle: string) => void;
}

export const LIBRARY_DOCS = [
  { id: "doc1", title: "План першого навчального корпусу" },
  { id: "doc2", title: "Зміни до розкладу занять" },
  { id: "doc3", title: "Правила внутрішнього розпорядку" },
  { id: "doc4", title: "Перелік викладачів та кафедр" },
  { id: "doc5", title: "Контакти адміністрації" },
];

export function LibraryPage({ onBack, onOpenDocument }: LibraryPageProps) {
  return (
    <div className="lib-root">
      {/* Header */}
      <header className="lib-header">
        <button className="lib-back-btn" onClick={onBack} aria-label="Назад">
          <BackIcon />
        </button>
        <h1 className="lib-title">Бібліотека</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Document list */}
      <div className="lib-list">
        {LIBRARY_DOCS.map((doc) => (
          <button
            key={doc.id}
            className="lib-doc-btn"
            onClick={() => onOpenDocument(doc.title)}
          >
            <span>{doc.title}</span>
            <ChevronIcon />
          </button>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .lib-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .lib-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #EBEBEB;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .lib-back-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          border-radius: 12px; color: #1a1a1a;
          transition: background 0.15s;
        }
        .lib-back-btn:hover { background: #F5F5F5; }

        .lib-title {
          font-size: 17px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .lib-list {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .lib-doc-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          padding: 15px 20px;
          background: #8A0F29;
          border: none;
          border-radius: 28px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          box-shadow: 0 2px 0 rgba(0,0,0,0.12);
        }
        .lib-doc-btn:hover {
          background: #9e1230;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(138,15,41,0.3);
        }
        .lib-doc-btn:active { transform: translateY(0); }

        /* Tablet / Desktop */
        @media (min-width: 768px) {
          .lib-header { padding: 16px 24px; }
          .lib-list { padding: 32px 24px; }
          .lib-doc-btn { font-size: 15px; padding: 16px 24px; }
        }
      `}</style>
    </div>
  );
}

// ── Icons ──
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);
