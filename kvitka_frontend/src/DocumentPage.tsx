// Document stubs database
export interface DocData {
  id: string;
  title: string;
  date: string;
  time: string;
  content: string;
  hasMore?: boolean;
}

export const DOCS_DB: Record<string, DocData> = {
  "План першого навчального корпусу": {
    id: "doc1",
    title: "План першого навчального корпусу",
    date: "15.06.2026",
    time: "14:31",
    content:
      "Перший навчальний корпус є основною будівлею закладу освіти та складається з трьох поверхів. У корпусі розташовані навчальні аудиторії, лабораторії, адміністративні кабінети, викладацькі кімнати та зони відпочинку для студентів.\n\nПоверх 1: адміністрація (каб. 101–110), бібліотека (каб. 112), актова зала (каб. 115), буфет (каб. 118).\n\nПоверх 2: навчальні аудиторії 201–235, комп'ютерний клас (каб. 218), лінгафонний кабінет (каб. 222).\n\nПоверх 3: лабораторії 301–320, кафедра інформатики (каб. 315), викладацька (каб. 318).",
    hasMore: true,
  },
  "Зміни до розкладу занять": {
    id: "doc2",
    title: "Зміни до розкладу занять",
    date: "18.06.2026",
    time: "08:15",
    content:
      "Зміни в розкладі занять на 18.06.2026:\n\n• Математика (10:00) — перенесено до ауд. 215\n• Фізика (12:00) — заняття скасовано\n• Хімія (14:00) — відбувається без змін, ауд. 307\n• Українська мова (16:00) — перенесено на 17:00, ауд. 204\n\nВсі інші пари відбуваються згідно з розкладом. При виникненні питань звертайтеся до деканату (каб. 103).",
    hasMore: false,
  },
  "Правила внутрішнього розпорядку": {
    id: "doc3",
    title: "Правила внутрішнього розпорядку",
    date: "01.09.2025",
    time: "09:00",
    content:
      "Загальні правила поведінки у навчальному закладі:\n\n• Студенти зобов'язані дотримуватись розкладу занять\n• Використання мобільних телефонів під час занять заборонено\n• Паління на території закладу суворо заборонено\n• Дотримання чистоти та порядку є обов'язком кожного\n\nПорушення правил тягне за собою дисциплінарну відповідальність відповідно до Статуту закладу.",
    hasMore: true,
  },
  "Перелік викладачів та кафедр": {
    id: "doc4",
    title: "Перелік викладачів та кафедр",
    date: "10.06.2026",
    time: "11:00",
    content:
      "Кафедра інформаційних технологій (каб. 315):\n• Іваненко О. В. — завідувач кафедри\n• Петренко А. М. — старший викладач\n• Сидоренко Л. К. — викладач\n\nКафедра природничих наук (каб. 205):\n• Коваленко Т. І. — завідувач кафедри\n• Мельник В. Р. — старший викладач\n\nКафедра гуманітарних дисциплін (каб. 118):\n• Бондаренко Н. О. — завідувач кафедри",
    hasMore: true,
  },
  "Контакти адміністрації": {
    id: "doc5",
    title: "Контакти адміністрації",
    date: "05.06.2026",
    time: "10:30",
    content:
      "Директор: Шевченко Микола Петрович\nТел.: +38 (044) 123-45-67\nEmail: director@kvitka.edu.ua\nКаб.: 101\n\nЗаступник з навчальної роботи: Лисенко Ірина Василівна\nТел.: +38 (044) 123-45-68\nEmail: navchannia@kvitka.edu.ua\nКаб.: 102\n\nДеканат (загальні питання):\nТел.: +38 (044) 123-45-69\nEmail: dekanat@kvitka.edu.ua\nКаб.: 103\nГодини прийому: пн–пт 9:00–17:00",
    hasMore: false,
  },
};

// Fallback for unknown titles
const FALLBACK_DOC: DocData = {
  id: "unknown",
  title: "Документ",
  date: new Date().toLocaleDateString("uk-UA"),
  time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
  content: "Вміст документа недоступний. Зверніться до адміністрації для отримання інформації.",
  hasMore: false,
};

interface DocumentPageProps {
  docTitle: string;
  onBack: () => void;
}

export function DocumentPage({ docTitle, onBack }: DocumentPageProps) {
  const doc = DOCS_DB[docTitle] ?? { ...FALLBACK_DOC, title: docTitle };

  // Format content with paragraph breaks
  const paragraphs = doc.content.split("\n\n").map((block) =>
    block.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < block.split("\n").length - 1 && <br />}
      </span>
    ))
  );

  return (
    <div className="doc-root">
      {/* Header */}
      <header className="doc-header">
        <button className="doc-back-btn" onClick={onBack} aria-label="Назад">
          <BackIcon />
        </button>
        <div style={{ width: 40 }} />
      </header>

      {/* Content */}
      <div className="doc-content">
        <h1 className="doc-title">{doc.title}</h1>

        <div className="doc-meta">
          <span className="doc-meta-date">{doc.date}</span>
          <span className="doc-meta-sep">·</span>
          <span className="doc-meta-time">{doc.time}</span>
        </div>

        <div className="doc-body">
          {paragraphs.map((para, i) => (
            <p key={i} className="doc-para">{para}</p>
          ))}
        </div>

        {doc.hasMore && (
          <button className="doc-more-btn">
            <DocIcon />
            <span>переглянути більше</span>
          </button>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .doc-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .doc-header {
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

        .doc-back-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          border-radius: 12px; color: #1a1a1a;
          transition: background 0.15s;
        }
        .doc-back-btn:hover { background: #F5F5F5; }

        .doc-content {
          flex: 1;
          padding: 24px 20px 40px;
          max-width: 680px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .doc-title {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 10px;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        .doc-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 22px;
          font-size: 12px;
          color: #AAA;
        }
        .doc-meta-sep { font-size: 16px; color: #CCC; }

        .doc-body { display: flex; flex-direction: column; gap: 14px; }

        .doc-para {
          margin: 0;
          font-size: 14px;
          color: #2a2a2a;
          line-height: 1.75;
        }

        .doc-more-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          cursor: pointer;
          color: #8A0F29;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          padding: 0;
          margin-top: 24px;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .doc-more-btn:hover { color: #C0254A; }

        /* Tablet / Desktop */
        @media (min-width: 768px) {
          .doc-header { padding: 16px 24px; }
          .doc-content { padding: 36px 32px 60px; }
          .doc-title { font-size: 26px; }
          .doc-para { font-size: 15px; }
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

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
  </svg>
);
