const API_URL = "http://127.0.0.1:8000";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  message: string;
  id: number;
  username: string;
  email: string;
}

interface ChangePasswordResponse {
  message: string;
}

interface UpdateProfileResponse {
  message: string;
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("E-mail ou senha inválidos.");
  }

  return response.json();
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const params = new URLSearchParams();

  params.set("username", username);
  params.set("email", email);
  params.set("password", password);

  const response = await fetch(
    `${API_URL}/auth/register?${params.toString()}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail || "Não foi possível criar a conta."
    );
  }

  return response.json();
}

export async function getMe() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível obter o usuário autenticado.");
  }

  return response.json();
}

export async function updateProfile(
  username: string
): Promise<UpdateProfileResponse> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
    }),
  });

  const errorBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      errorBody?.detail ||
        "Não foi possível atualizar o nome de usuário."
    );
  }

  return errorBody;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const errorBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      errorBody?.detail || "Não foi possível alterar a senha."
    );
  }

  return errorBody;
}