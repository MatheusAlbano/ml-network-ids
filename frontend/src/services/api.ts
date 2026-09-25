const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new ApiError(`Erro ao buscar ${path}`, response.status);
  }

  return response.json();
}

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new ApiError(
      errorBody?.detail
        ? JSON.stringify(errorBody.detail)
        : `Erro ao enviar para ${path}`,
      response.status
    );
  }

  return response.json();
}

export async function apiPostFile<T>(
  path: string,
  file: File
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new ApiError(
      errorBody?.detail
        ? JSON.stringify(errorBody.detail)
        : `Erro ao enviar arquivo para ${path}`,
      response.status
    );
  }

  return response.json();
}

export async function apiPatch<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new ApiError(
      errorBody?.detail
        ? JSON.stringify(errorBody.detail)
        : `Erro ao atualizar ${path}`,
      response.status
    );
  }

  return response.json();
}

export async function apiDelete<T>(
  path: string
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new ApiError(
      errorBody?.detail
        ? JSON.stringify(errorBody.detail)
        : `Erro ao excluir ${path}`,
      response.status
    );
  }

  return response.json();
}