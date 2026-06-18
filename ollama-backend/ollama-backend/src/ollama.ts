import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.OLLAMA_URL!,
  apiKey: "ollama"
});
// ollama.ts
// ollama.ts
export async function createEmbedding(text: string | null | undefined) {
  const cleanedText = typeof text === "string" ? text.trim() : "";

  // Якщо текст пустий, повертаємо null або пустий масив, щоб не робити марний запит
  if (!cleanedText) {
    return null;
  }

  const response = await fetch("http://localhost:11434/api/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.EMBED_MODEL,
      input: [cleanedText] // Передаємо як масив рядків — так надійніше для багатьох моделей
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama embed error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // bge-m3 повертає масив масивів у полі embeddings
  return data.embeddings?.[0] || null;
}

// src/ollama.ts
export async function chat(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const response = await client.chat.completions.create({
    model: process.env.CHAT_MODEL!,
    messages,
    max_tokens: 2048, // 🟢 Збільшуємо ліміт відповіді, щоб ШІ не обривав речення
    temperature: 0.3,  // 🟢 Надаємо моделі трохи стабільності
  });

  return response.choices?.[0]?.message?.content ?? null;
}