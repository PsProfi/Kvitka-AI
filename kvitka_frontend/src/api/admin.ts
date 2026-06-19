export interface AdminDocument {
  id: string;
  title: string;
  content_type: string;
  source: string;
  created_at: string;
  updated_at: string;
  content?: string;
}

import { BASE_URL } from "./apiConfig";

function getAuthToken() {
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || "";
}

export async function getDocuments() {
  const token = getAuthToken();
  const response = await fetch(`${BASE_URL}/admin/documents`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Не вдалося завантажити документи");
  }

  return response.json() as Promise<AdminDocument[]>;
}

export async function getDocumentById(id: string) {
  const token = getAuthToken();
  const response = await fetch(`${BASE_URL}/admin/documents/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Не вдалося завантажити документ");
  }

  return response.json() as Promise<AdminDocument>;
}

export async function uploadDocument(file: File, title: string) {
  const token = getAuthToken();
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);

  const response = await fetch(`${BASE_URL}/admin/documents/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Не вдалося завантажити документ");
  }

  return response.json() as Promise<AdminDocument>;
}

export async function updateDocument(id: string, payload: { title?: string; content?: string }) {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/admin/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Не вдалося оновити документ");
  }

  return response.json() as Promise<AdminDocument>;
}

export async function deleteDocument(id: string) {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/admin/documents/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Не вдалося видалити документ");
  }

  return response.json() as Promise<{ success: boolean }>;
}
