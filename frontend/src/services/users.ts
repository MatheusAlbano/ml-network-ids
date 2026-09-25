import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "./api";

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
}

export function createUser(
  data: CreateUserData
): Promise<UserResponse> {
  return apiPost<UserResponse>("/users/", data);
}

export function getUsers(): Promise<UserResponse[]> {
  return apiGet<UserResponse[]>("/users/");
}

export function toggleUserActive(
  userId: number
): Promise<UserResponse> {
  return apiPatch<UserResponse>(
    `/users/${userId}/toggle-active`
  );
}

export function updateUserRole(
  userId: number,
  role: "admin" | "user"
): Promise<UserResponse> {
  return apiPatch<UserResponse>(
    `/users/${userId}/role?role=${role}`
  );
}

export function resetUserPassword(
  userId: number,
  newPassword: string
): Promise<{
  message: string;
  id: number;
  username: string;
}> {
  return apiPost<{
    message: string;
    id: number;
    username: string;
  }>(
    `/users/${userId}/reset-password`,
    {
      new_password: newPassword,
    }
  );
}

export function deleteUser(
  userId: number
): Promise<{ message: string; id: number }> {
  return apiDelete<{ message: string; id: number }>(
    `/users/${userId}`
  );
}