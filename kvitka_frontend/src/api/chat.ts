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
  sessionId: string;
}

export interface ChatSession {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface StoredChatMessage {
  id: string;
  session_id: string;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  created_at: string;
}

const BASE_URL = "http://192.168.0.158:3001";

function getAuthToken() {
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || "";
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getChatSessions(userId: number): Promise<ChatSession[]> {
  const response = await fetch(`${BASE_URL}/chat/sessions?userId=${userId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Не вдалося завантажити чати");
  }

  return response.json();
}

export async function createChatSession(userId: number, title = "Новий чат"): Promise<ChatSession> {
  const response = await fetch(`${BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, title }),
  });

  if (!response.ok) {
    throw new Error("Не вдалося створити чат");
  }

  return response.json();
}

export async function getChatMessages(sessionId: string, userId: number): Promise<StoredChatMessage[]> {
  const response = await fetch(`${BASE_URL}/chat/sessions/${sessionId}/messages?userId=${userId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Не вдалося завантажити повідомлення");
  }

  return response.json();
}

export async function sendMessage(
  messages: Message[],
  options: { userId: number; sessionId?: string }
): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, userId: options.userId, sessionId: options.sessionId }),
  });

  if (!response.ok) {
    throw new Error("Помилка запиту");
  }

  return response.json();
}

export function openChatEvents(userId: number) {
  return new EventSource(`${BASE_URL}/chat/events?userId=${userId}`);
}
