import "dotenv/config";

import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse";
import path from "path";
import fs from "fs/promises";

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
      created_at: row.id ? String(row.id) : new Date().toISOString(),
      updated_at: row.id ? String(row.id) : new Date().toISOString(),
    };

    if (!existing) {
      docs.set(id, item);
    } else if (row.id > Number(existing.updated_at)) {
      existing.updated_at = String(row.id);
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

interface PersistedChatSession {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface PersistedChatMessage {
  id: string;
  session_id: string;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  sources: Array<{ id: number; title: string; fileName: string; similarityPercent: number }>;
  created_at: string;
}

interface ChatData {
  sessions: PersistedChatSession[];
  messages: PersistedChatMessage[];
}

const chatDataFilePath = path.join(process.cwd(), "data", "chat_data.json");
const sseClients = new Map<string, Set<express.Response>>();

async function ensureChatDataFile() {
  await fs.mkdir(path.dirname(chatDataFilePath), { recursive: true });
  try {
    await fs.access(chatDataFilePath);
  } catch {
    await fs.writeFile(chatDataFilePath, JSON.stringify({ sessions: [], messages: [] }, null, 2), "utf8");
  }
}

async function readChatData(): Promise<ChatData> {
  try {
    await ensureChatDataFile();
    const content = await fs.readFile(chatDataFilePath, "utf8");
    return JSON.parse(content) as ChatData;
  } catch (error) {
    console.error("Не вдалося зчитати дані чату:", error);
    return { sessions: [], messages: [] };
  }
}

async function writeChatData(data: ChatData) {
  await ensureChatDataFile();
  await fs.writeFile(chatDataFilePath, JSON.stringify(data, null, 2), "utf8");
}

function sendSseEvent(userId: string, event: string, payload: any) {
  const listeners = sseClients.get(userId);
  if (!listeners) return;

  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  for (const res of listeners) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n\n`);
  }
}

app.get("/chat/sessions", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const data = await readChatData();
    const userSessions = data.sessions
      .filter((session) => session.user_id === userId)
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

    res.json(userSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося завантажити чати" });
  }
});

app.post("/chat/sessions", async (req, res) => {
  const userId = Number(req.body.userId);
  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Новий чат";

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const data = await readChatData();
    const now = new Date().toISOString();
    const session: PersistedChatSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      created_at: now,
      updated_at: now,
    };

    data.sessions.unshift(session);
    await writeChatData(data);
    sendSseEvent(String(userId), "chat-session", { session_id: session.id });
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося створити чат" });
  }
});

app.get("/chat/sessions/:sessionId/messages", async (req, res) => {
  const userId = Number(req.query.userId);
  const sessionId = req.params.sessionId;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: "userId and sessionId are required" });
  }

  try {
    const data = await readChatData();
    const session = data.sessions.find((item) => item.id === sessionId && item.user_id === userId);
    if (!session) {
      return res.status(404).json({ error: "Чат не знайдено" });
    }

    const messages = data.messages
      .filter((message) => message.session_id === sessionId)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не вдалося завантажити повідомлення" });
  }
});

app.get("/chat/events", (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(`: connected\n\n`);

  const listeners = sseClients.get(userId) || new Set<express.Response>();
  listeners.add(res);
  sseClients.set(userId, listeners);

  req.on("close", () => {
    const set = sseClients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      sseClients.delete(userId);
    }
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, message, userId: rawUserId, sessionId: rawSessionId } = req.body;
    const userId = Number(rawUserId);
    const sessionId = typeof rawSessionId === "string" && rawSessionId.trim() ? rawSessionId.trim() : undefined;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let userText = "";
    let history = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      history = messages;
      userText = messages[messages.length - 1]?.content || "";
    } else if (typeof message === "string") {
      userText = message;
      history = [{ role: "user", content: message }];
    }

    if (!userText.trim()) {
      return res.status(400).json({ error: "Повідомлення порожнє" });
    }

    const data = await readChatData();
    let session = sessionId
      ? data.sessions.find((item) => item.id === sessionId && item.user_id === userId)
      : undefined;

    if (!session) {
      const now = new Date().toISOString();
      session = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: "Новий чат",
        created_at: now,
        updated_at: now,
      };
      data.sessions.unshift(session);
      sendSseEvent(String(userId), "chat-session", { session_id: session.id });
    }

    const now = new Date().toISOString();
    const userMessage: PersistedChatMessage = {
      id: crypto.randomUUID(),
      session_id: session.id,
      user_id: userId,
      role: "user",
      content: userText,
      sources: [],
      created_at: now,
    };
    data.messages.push(userMessage);

    const queryEmbedding = await createEmbedding(userText);
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length !== 1024) {
      console.log(`Розмірність отриманого вектора: ${queryEmbedding?.length}`);
    }

    const { data: rawChunks, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 5,
    });

    if (error) throw error;

    const seenContent = new Set();
    const relevantChunks = [];

    for (const item of rawChunks) {
      if (item.similarity > 0.3 && !seenContent.has(item.content)) {
        seenContent.add(item.content);
        if (item.metadata?.source) {
          item.metadata.source = fixUtf8String(item.metadata.source);
        }
        relevantChunks.push(item);
      }
    }

    const contextText = relevantChunks.map((c) => c.content).join("\n\n");

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
${contextText}`,
    };

    const aiResponseText = await chat([systemInstruction, ...history]);
    let aiResponse = aiResponseText;

    if (aiResponse && (aiResponse.trim().startsWith("{") || aiResponse.trim().startsWith('{"answer"'))) {
      try {
        const parsed = JSON.parse(aiResponse);
        aiResponse = parsed.answer || parsed.reply || aiResponse;
      } catch (e) {
        // Якщо це не валідний JSON, залишаємо як є
      }
    }

    const sources = relevantChunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.metadata?.title || "Документ",
      fileName: chunk.metadata?.source || "file.pdf",
      similarityPercent: Math.round(chunk.similarity * 100),
    }));

    const assistantMessage: PersistedChatMessage = {
      id: crypto.randomUUID(),
      session_id: session.id,
      user_id: userId,
      role: "assistant",
      content: aiResponse || "Не вдалося згенерувати відповідь.",
      sources,
      created_at: new Date().toISOString(),
    };

    data.messages.push(assistantMessage);
    session.updated_at = new Date().toISOString();
    await writeChatData(data);

    sendSseEvent(String(userId), "chat-message", assistantMessage);
    sendSseEvent(String(userId), "chat-session", { session_id: session.id });

    res.json({
      answer: assistantMessage.content,
      sources,
      sessionId: session.id,
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
      .select("metadata, id")
      .order("id", { ascending: false });

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
      .select("content, metadata, id")
      .order("id", { ascending: true });

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
      created_at: rows[0].id ? String(rows[0].id) : new Date().toISOString(),
      updated_at: rows[rows.length - 1].id ? String(rows[rows.length - 1].id) : new Date().toISOString(),
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
      .select("content,metadata,id")
      .order("id", { ascending: true });

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