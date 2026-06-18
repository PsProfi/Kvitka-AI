import "dotenv/config";

import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse";
import path from "path";

import { supabase } from "./supabase.js";
import { createEmbedding, chat } from "./ollama.js";

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());
app.use(express.json());

function splitText(text: string, chunkSize = 300) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function extractTextFromFile(file: Express.Multer.File) {
  const fileName = file.originalname || "document";
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf" || file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    return String(data.text || "");
  }

  if (extension === ".txt" || file.mimetype === "text/plain") {
    return file.buffer.toString("utf8");
  }

  throw new Error("Підтримуються тільки PDF та TXT файли");
}

async function ingestDocumentChunks(
  documentId: string,
  title: string,
  text: string,
  source: string,
  contentType: string
) {
  const chunks = splitText(text, 300);
  const rows: any[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const embedding = await createEmbedding(trimmed);
    if (!embedding) continue;

    rows.push({
      content: trimmed,
      metadata: {
        document_id: documentId,
        title,
        source,
        content_type: contentType,
      },
      embedding,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("document_chunks").insert(rows);
    if (error) {
      throw error;
    }
  }

  return rows.length;
}

function buildDocumentList(rows: any[]) {
  const docs = new Map<string, any>();

  for (const row of rows) {
    const metadata = row.metadata;
    if (!metadata?.document_id) continue;
    const id = String(metadata.document_id);

    const existing = docs.get(id);
    const item = {
      id,
      title: metadata.title || metadata.source || "Документ",
      source: metadata.source || "",
      content_type: metadata.content_type || "text/plain",
      created_at: row.inserted_at,
      updated_at: row.inserted_at,
    };

    if (!existing) {
      docs.set(id, item);
    } else if (row.inserted_at > existing.updated_at) {
      existing.updated_at = row.inserted_at;
    }
  }

  return Array.from(docs.values());
}
// Функція для виправлення кракозябр (Mojibake UTF-8)
// Функція для виправлення кракозябр (Mojibake UTF-8)
function fixUtf8String(str: string): string {
  try {
    return Buffer.from(str, 'binary').toString('utf8');
  } catch {
    return str;
  }
}

app.post("/chat", async (req, res) => {
  try {
    // 1. Отримуємо повідомлення (підтримка як масиву messages, так і одиночного message для старих запитів)
    const { messages, message } = req.body;
    
    let userText = "";
    let history = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      history = messages;
      userText = messages[messages.length - 1]?.content || "";
    } else if (message) {
      userText = message;
      history = [{ role: "user", content: message }];
    }

    if (!userText.trim()) {
      return res.status(400).json({ error: "Повідомлення порожнє" });
    }

    // 2. Створюємо ембеддінг
    const queryEmbedding = await createEmbedding(userText);

    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length !== 1024) {
      // Якщо bge-m3 видає іншу розмірність, дізнаємось про це з логів
      console.log(`Розмірність отриманого вектора: ${queryEmbedding?.length}`);
    }

    // 3. Шукаємо в Supabase
    const { data: rawChunks, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 5
    });

    if (error) throw error;

    // Фільтрація та дедублікація джерел за текстом
    const seenContent = new Set();
    const relevantChunks = [];

    for (const item of rawChunks) {
      if (item.similarity > 0.45 && !seenContent.has(item.content)) {
        seenContent.add(item.content);
        if (item.metadata?.source) {
          item.metadata.source = fixUtf8String(item.metadata.source);
        }
        relevantChunks.push(item);
      }
    }

    const contextText = relevantChunks.map(c => c.content).join("\n\n");

    // 4. Формуємо інструкцію для ШІ
    const systemInstruction = {
  role: "system" as const,
  content: `Ти — суворий і лаконічний корпоративний асистент, який відповідає ТІЛЬКИ фактами з наданого контексту.

КРИТИЧНІ ПРАВИЛА ОФОРМЛЕННЯ:
1. Тобі КАТЕГОРИЧНО ЗАБОРОНЕНО використовувати будь-які зірочки (* або **) у тексті. 
2. Не роби слова жирними і не використовуй зірочки для списків.
3. Якщо потрібно зробити список, пиши кожен пункт з нового рядка, починаючи зі звичайної цифри з крапкою (наприклад, 1., 2., 3.) або просто пиши текстом через абзаци.
4. Якщо інформації немає в контексті, коротко скажи: "Я не знайшов інформацію в базі знань."


ПРАВИЛА ВІДПОВІДІ:
1. Пиши відповідь максимально коротко, сухо та по суті, без вступних слів, ліричних відступів та драматизації.
2. Говори ТІЛЬКИ про те, що прямо написано в контексті. Якщо в контексті написано "розробити інструкцію як робити резервну копію", ти НЕ маєш права писати "система вирішує проблему відсутності бекапів". Не вигадуй причини та наслідки.
3. Якщо контекст містить списки — виводь їх як списки, використовуючи символ *.
4. Якщо інформації у контексті недостатньо для прямої відповіді, просто скажи: "У наданих документах немає точної інформації з цього приводу."

Контекст для роботи:
${contextText}`
};

    // Отримуємо відповідь від Ollama
    let aiResponse = await chat([systemInstruction, ...history]);

    // ПІДСТРАХОВКА: Якщо модель все одно проігнорувала інструкцію і видала JSON-рядок
    if (aiResponse && (aiResponse.trim().startsWith("{") || aiResponse.trim().startsWith('{"answer"'))) {
      try {
        const parsed = JSON.parse(aiResponse);
        aiResponse = parsed.answer || parsed.reply || aiResponse;
      } catch (e) {
        // Якщо це не валідний JSON, залишаємо як є
      }
    }

    // 5. Формуємо масив чистих джерел
    const sources = relevantChunks.map(chunk => ({
      id: chunk.id,
      title: chunk.metadata?.title || "Документ",
      fileName: chunk.metadata?.source || "file.pdf",
      similarityPercent: Math.round(chunk.similarity * 100)
    }));

    // Відправляємо на фронтенд чистий об'єкт
    res.json({
      answer: aiResponse || "Не вдалося згенерувати відповідь.",
      sources: sources
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/admin/documents", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("metadata, inserted_at")
      .order("inserted_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json(buildDocumentList(data || []));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося отримати документи" });
  }
});

app.get("/admin/documents/:id", async (req, res) => {
  try {
    const documentId = req.params.id;
    const { data, error } = await supabase
      .from("document_chunks")
      .select("content, metadata, inserted_at")
      .order("inserted_at", { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data || []).filter(
      (item: any) => String(item.metadata?.document_id) === documentId
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Документ не знайдено" });
    }

    const metadata = rows[0].metadata;
    res.json({
      id: documentId,
      title: metadata.title || metadata.source || "Документ",
      source: metadata.source || "",
      content_type: metadata.content_type || "text/plain",
      created_at: rows[0].inserted_at || new Date().toISOString(),
      updated_at: rows[rows.length - 1].inserted_at || new Date().toISOString(),
      content: rows.map((row: any) => row.content).join("\n\n"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося завантажити документ" });
  }
});

app.post(
  "/admin/documents/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const title = String(req.body.title || "").trim();
      const file = req.file;

      if (!title) {
        return res.status(400).json({ error: "Назва документу обов'язкова" });
      }
      if (!file) {
        return res.status(400).json({ error: "Файл не додано" });
      }

      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        return res.status(400).json({ error: "Не вдалося витягти текст з файлу" });
      }

      const documentId = crypto.randomUUID();
      await ingestDocumentChunks(documentId, title, text, file.originalname, file.mimetype);

      res.json({
        id: documentId,
        title,
        source: file.originalname,
        content_type: file.mimetype,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: String(error) || "Не вдалося завантажити документ" });
    }
  }
);

app.patch("/admin/documents/:id", express.json(), async (req, res) => {
  try {
    const documentId = req.params.id;
    const { title, content } = req.body;

    const { data, error } = await supabase
      .from("document_chunks")
      .select("content,metadata,inserted_at")
      .order("inserted_at", { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data || []).filter(
      (item: any) => String(item.metadata?.document_id) === documentId
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Документ не знайдено" });
    }

    const metadata = rows[0].metadata;
    const newTitle = typeof title === "string" && title.trim() ? title.trim() : metadata.title;
    const newContent = typeof content === "string" ? content.trim() : "";

    if (newContent) {
      const { error: deleteError } = await supabase
        .from("document_chunks")
        .delete()
        .eq("metadata->>document_id", documentId);

      if (deleteError) {
        throw deleteError;
      }

      await ingestDocumentChunks(documentId, newTitle, newContent, metadata.source || "edited", metadata.content_type || "text/plain");
    } else if (newTitle !== metadata.title) {
      const updatedRows = rows.map((row: any) => ({
        ...row,
        metadata: {
          ...row.metadata,
          title: newTitle,
        },
      }));
      const { error: updateError } = await supabase
        .from("document_chunks")
        .update({ metadata: updatedRows[0].metadata })
        .eq("metadata->>document_id", documentId);

      if (updateError) {
        throw updateError;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) || "Не вдалося оновити документ" });
  }
});

app.delete("/admin/documents/:id", async (req, res) => {
  try {
    const documentId = req.params.id;
    const { error } = await supabase
      .from("document_chunks")
      .delete()
      .eq("metadata->>document_id", documentId);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося видалити документ" });
  }
});

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`API працює на http://localhost:${port}`);
});