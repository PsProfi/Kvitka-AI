export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatSource {
  id: number;
  title: string;
  fileName: string;
  similarityPercent: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export async function sendMessage(messages: Message[]): Promise<ChatResponse> {
  const response = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error("Помилка запиту");
  }

  return response.json();
}