import { useEffect, useState } from "react";

import { useToast } from "../components/ToastContext";

import {
  createUser,
  getUsers,
  toggleUserActive,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from "../services/users";

import type { UserResponse } from "../services/users";

import { getMe } from "../services/auth";

import { Header } from "../components/Header";

import {
  UserPlus,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

export function UserPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserResponse[]>([]);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState<"admin" | "user">("user");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [statusMessage, setStatusMessage] = useState("");

  const [statusError, setStatusError] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [showCreatePassword, setShowCreatePassword] =
    useState(false);

  const [userToDelete, setUserToDelete] =
    useState<UserResponse | null>(null);

  const [deletingUser, setDeletingUser] = useState(false);

  const [userToChangeRole, setUserToChangeRole] =
    useState<UserResponse | null>(null);

  const [changingRole, setChangingRole] = useState(false);

  const [userToResetPassword, setUserToResetPassword] =
    useState<UserResponse | null>(null);

  const [resetPassword, setResetPassword] = useState("");

  const [confirmResetPassword, setConfirmResetPassword] =
    useState("");

  const [showResetPassword, setShowResetPassword] =
    useState(false);

  const [showConfirmResetPassword, setShowConfirmResetPassword] =
    useState(false);

  const [resettingPassword, setResettingPassword] =
    useState(false);

  async function loadUsers() {
    try {
      setLoadingUsers(true);

      setError("");

      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);

      setError("Não foi possível carregar os usuários.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCurrentUser() {
    try {
      const user = await getMe();

      setCurrentUserId(user.id);
    } catch (error) {
      console.error(
        "Erro ao carregar usuário autenticado:",
        error
      );
    }
  }

  useEffect(() => {
    loadUsers();

    loadCurrentUser();
  }, []);

  function openCreateForm() {
    setMessage("");

    setError("");

    setShowCreatePassword(false);

    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (loading) {
      return;
    }

    setUsername("");

    setEmail("");

    setPassword("");

    setRole("user");

    setMessage("");

    setError("");

    setShowCreatePassword(false);

    setShowCreateForm(false);
  }

  const createPasswordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const createPasswordScore = Object.values(
    createPasswordRequirements
  ).filter(Boolean).length;

  const createPasswordStrong =
    createPasswordScore === 5;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    setError("");

    if (!createPasswordStrong) {
      showToast(
        "A senha deve atender a todos os requisitos de segurança.",
        "error"
      );

      return;
    }

    setLoading(true);

    try {
      const user = await createUser({
        username,
        email,
        password,
        role,
      });

      showToast(
        `Usuário ${user.username} criado com sucesso.`,
        "success"
      );

      setUsername("");

      setEmail("");

      setPassword("");

      setRole("user");

      setShowCreatePassword(false);

      await loadUsers();

      setShowCreateForm(false);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast(
          "Não foi possível criar o usuário.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(userId: number) {
    try {
      setStatusError("");

      setStatusMessage("");

      const updatedUser = await toggleUserActive(userId);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );

      if (updatedUser.is_active) {
        showToast(
          `Usuário ${updatedUser.username} ativado com sucesso.`,
          "success"
        );
      } else {
        showToast(
          `Usuário ${updatedUser.username} desativado com sucesso.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast(
          "Não foi possível alterar o status do usuário.",
          "error"
        );
      }
    }
  }

  async function handleChangeRole() {
    if (!userToChangeRole) {
      return;
    }

    const newRole =
      userToChangeRole.role === "admin"
        ? "user"
        : "admin";

    try {
      setChangingRole(true);

      setStatusError("");

      setStatusMessage("");

      const updatedUser = await updateUserRole(
        userToChangeRole.id,
        newRole
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );

      setStatusMessage(
        `Usuário ${updatedUser.username} agora é ${
          updatedUser.role === "admin"
            ? "administrador"
            : "usuário"
        }.`
      );

      setUserToChangeRole(null);
    } catch (error) {
      console.error("Erro ao alterar função:", error);

      if (error instanceof Error) {
        setStatusError(error.message);
      } else {
        setStatusError(
          "Não foi possível alterar a função do usuário."
        );
      }
    } finally {
      setChangingRole(false);
    }
  }

  function openResetPassword(user: UserResponse) {
    setResetPassword("");

    setConfirmResetPassword("");

    setShowResetPassword(false);

    setShowConfirmResetPassword(false);

    setUserToResetPassword(user);
  }

  function closeResetPassword() {
    if (resettingPassword) {
      return;
    }

    setUserToResetPassword(null);

    setResetPassword("");

    setConfirmResetPassword("");

    setShowResetPassword(false);

    setShowConfirmResetPassword(false);
  }

  const resetPasswordRequirements = {
    length: resetPassword.length >= 8,
    uppercase: /[A-Z]/.test(resetPassword),
    lowercase: /[a-z]/.test(resetPassword),
    number: /[0-9]/.test(resetPassword),
    symbol: /[^A-Za-z0-9]/.test(resetPassword),
  };

  const resetPasswordScore = Object.values(
    resetPasswordRequirements
  ).filter(Boolean).length;

  const resetPasswordStrong =
    resetPasswordScore === 5;

  const resetPasswordsMatch =
    resetPassword.length > 0 &&
    resetPassword === confirmResetPassword;

  async function handleResetPassword() {
    if (!userToResetPassword) {
      return;
    }

    if (!resetPasswordStrong) {
      showToast(
        "A nova senha deve atender a todos os requisitos de segurança.",
        "error"
      );

      return;
    }

    if (resetPassword !== confirmResetPassword) {
      showToast(
        "As senhas não coincidem.",
        "error"
      );

      return;
    }

    try {
      setResettingPassword(true);

      await resetUserPassword(
        userToResetPassword.id,
        resetPassword
      );

      showToast(
        `Senha do usuário ${userToResetPassword.username} redefinida com sucesso.`,
        "success"
      );

      closeResetPassword();
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast(
          "Não foi possível redefinir a senha.",
          "error"
        );
      }
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) {
      return;
    }

    try {
      setDeletingUser(true);

      setStatusError("");

      setStatusMessage("");

      await deleteUser(userToDelete.id);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== userToDelete.id
        )
      );

      showToast(
        `Usuário ${userToDelete.username} excluído com sucesso.`,
        "success"
      );

      setUserToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast(
          "Não foi possível excluir o usuário.",
          "error"
        );
      }
    } finally {
      setDeletingUser(false);
    }
  }

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers = users.filter(
    (user) => !user.is_active
  ).length;

  const adminUsers = users.filter(
    (user) => user.role === "admin"
  ).length;

  return (
    <>
      <Header
        title="Área do Administrador"
        subtitle="Gerenciar usuários e permissões de acesso ao sistema"
      />

      <div className="space-y-6 p-8">
        {/* RESUMO */}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de usuários
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {users.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Usuários ativos
                </p>

                <p className="mt-2 text-2xl font-bold text-green-500">
                  {activeUsers}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <UserCheck size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Usuários inativos
                </p>

                <p className="mt-2 text-2xl font-bold text-red-500">
                  {inactiveUsers}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <UserX size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Administradores
                </p>

                <p className="mt-2 text-2xl font-bold text-primary">
                  {adminUsers}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* CRIAR USUÁRIO */}

        {!showCreateForm ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="group w-full rounded-xl border border-border bg-surface p-5 text-left transition-all hover:border-primary/40 hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-100">
                    Criar novo usuário
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Adicione uma nova conta ao sistema.
                  </p>
                </div>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <UserPlus size={17} />
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    Criar novo usuário
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Preencha os dados para criar uma nova conta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={loading}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Fechar"
                aria-label="Fechar formulário"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-2"
            >
              {message && (
                <div className="md:col-span-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
                  {message}
                </div>
              )}

              {error && (
                <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium"
                >
                  Usuário
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="ex: joao"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="joao@email.com"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Senha
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showCreatePassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Digite a senha"
                    minLength={8}
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreatePassword(
                        (current) => !current
                      )
                    }
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      showCreatePassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-label={
                      showCreatePassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showCreatePassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Força da senha
                    </p>

                    {password.length > 0 && (
                      <p
                        className={`text-xs font-medium ${
                          createPasswordStrong
                            ? "text-green-500"
                            : createPasswordScore >= 3
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {createPasswordStrong
                          ? "Forte"
                          : createPasswordScore >= 3
                          ? "Média"
                          : "Fraca"}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(
                      (level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= createPasswordScore
                              ? createPasswordStrong
                                ? "bg-green-500"
                                : createPasswordScore >= 3
                                ? "bg-yellow-500"
                                : "bg-red-500"
                              : "bg-gray-700"
                          }`}
                        />
                      )
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <p
                      className={`text-xs ${
                        createPasswordRequirements.length
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createPasswordRequirements.length
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos 8 caracteres
                    </p>

                    <p
                      className={`text-xs ${
                        createPasswordRequirements.uppercase
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createPasswordRequirements.uppercase
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos uma letra maiúscula
                    </p>

                    <p
                      className={`text-xs ${
                        createPasswordRequirements.lowercase
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createPasswordRequirements.lowercase
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos uma letra minúscula
                    </p>

                    <p
                      className={`text-xs ${
                        createPasswordRequirements.number
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createPasswordRequirements.number
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos um número
                    </p>

                    <p
                      className={`text-xs ${
                        createPasswordRequirements.symbol
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createPasswordRequirements.symbol
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos um símbolo
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium"
                >
                  Tipo de usuário
                </label>

                <select
                  id="role"
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value as
                        | "admin"
                        | "user"
                    )
                  }
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">
                    Usuário
                  </option>

                  <option value="admin">
                    Administrador
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={loading}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !createPasswordStrong
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={17} />

                  {loading
                    ? "Criando..."
                    : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        )}

        {message && !showCreateForm && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
            {message}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
            {statusMessage}
          </div>
        )}

        {statusError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {statusError}
          </div>
        )}

        {/* USUÁRIOS CADASTRADOS */}

        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Usuários cadastrados
                </h2>

                <p className="text-sm text-muted-foreground">
                  Contas e permissões de acesso ao sistema.
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center p-10">
              <p className="text-sm text-muted-foreground">
                Carregando usuários...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Users
                size={32}
                className="mb-3 text-muted-foreground"
              />

              <p className="text-sm font-medium">
                Nenhum usuário cadastrado
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Crie um usuário utilizando o botão acima.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Usuário
                    </th>

                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      E-mail
                    </th>

                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Função
                    </th>

                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {user.username
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium">
                              {user.username}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              ID #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() =>
                              user.id !== 1 &&
                              user.id !== currentUserId &&
                              setUserToChangeRole(user)
                            }
                            disabled={
                              user.id === 1 ||
                              user.id === currentUserId
                            }
                            title={
                              user.id === 1
                                ? "A conta principal não pode ter a função alterada."
                                : user.id === currentUserId
                                ? "Você não pode alterar sua própria função."
                                : "Clique para alterar a função"
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-default"
                          >
                            <ShieldCheck size={13} />

                            Administrador
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              user.id !== currentUserId &&
                              setUserToChangeRole(user)
                            }
                            disabled={
                              user.id === currentUserId
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default"
                            title={
                              user.id === currentUserId
                                ? "Você não pode alterar sua própria função."
                                : "Clique para alterar a função"
                            }
                          >
                            <Shield size={13} />

                            Usuário
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-2 text-green-500">
                            <span className="h-2 w-2 rounded-full bg-green-500" />

                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-red-500">
                            <span className="h-2 w-2 rounded-full bg-red-500" />

                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {user.id !== 1 &&
                            user.id !== currentUserId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openResetPassword(user)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                                  title="Redefinir senha"
                                >
                                  <KeyRound size={14} />

                                  Senha
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleActive(user.id)
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    user.is_active
                                      ? "border-border text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                                      : "border-green-500/30 bg-green-500/5 text-green-500 hover:bg-green-500 hover:text-white"
                                  }`}
                                >
                                  {user.is_active ? (
                                    <>
                                      <UserX size={14} />

                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={14} />

                                      Ativar
                                    </>
                                  )}
                                </button>

                                {!user.is_active && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUserToDelete(user)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 size={14} />

                                    Excluir
                                  </button>
                                )}
                              </>
                            )}

                          {(user.id === 1 ||
                            user.id === currentUserId) && (
                            <span className="text-xs text-muted-foreground">
                              {user.id === 1
                                ? "Conta principal"
                                : "Sua conta"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL REDEFINIR SENHA */}

      {userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  Redefinir senha
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Defina uma nova senha para o usuário{" "}
                  <span className="font-semibold text-gray-200">
                    {userToResetPassword.username}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                A senha atual não pode ser visualizada. Uma nova
                senha será definida para esta conta.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="reset-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Nova senha
                </label>

                <div className="relative">
                  <input
                    id="reset-password"
                    type={
                      showResetPassword
                        ? "text"
                        : "password"
                    }
                    value={resetPassword}
                    onChange={(event) =>
                      setResetPassword(event.target.value)
                    }
                    placeholder="Digite a nova senha"
                    minLength={8}
                    disabled={resettingPassword}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowResetPassword(
                        (current) => !current
                      )
                    }
                    disabled={resettingPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      showResetPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-label={
                      showResetPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showResetPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Força da senha
                    </p>

                    {resetPassword.length > 0 && (
                      <p
                        className={`text-xs font-medium ${
                          resetPasswordStrong
                            ? "text-green-500"
                            : resetPasswordScore >= 3
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {resetPasswordStrong
                          ? "Forte"
                          : resetPasswordScore >= 3
                          ? "Média"
                          : "Fraca"}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(
                      (level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= resetPasswordScore
                              ? resetPasswordStrong
                                ? "bg-green-500"
                                : resetPasswordScore >= 3
                                ? "bg-yellow-500"
                                : "bg-red-500"
                              : "bg-gray-700"
                          }`}
                        />
                      )
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <p
                      className={`text-xs ${
                        resetPasswordRequirements.length
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resetPasswordRequirements.length
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos 8 caracteres
                    </p>

                    <p
                      className={`text-xs ${
                        resetPasswordRequirements.uppercase
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resetPasswordRequirements.uppercase
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos uma letra maiúscula
                    </p>

                    <p
                      className={`text-xs ${
                        resetPasswordRequirements.lowercase
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resetPasswordRequirements.lowercase
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos uma letra minúscula
                    </p>

                    <p
                      className={`text-xs ${
                        resetPasswordRequirements.number
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resetPasswordRequirements.number
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos um número
                    </p>

                    <p
                      className={`text-xs ${
                        resetPasswordRequirements.symbol
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resetPasswordRequirements.symbol
                        ? "✓"
                        : "○"}{" "}
                      Pelo menos um símbolo
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-reset-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirmar nova senha
                </label>

                <div className="relative">
                  <input
                    id="confirm-reset-password"
                    type={
                      showConfirmResetPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmResetPassword}
                    onChange={(event) =>
                      setConfirmResetPassword(
                        event.target.value
                      )
                    }
                    placeholder="Digite a senha novamente"
                    minLength={8}
                    disabled={resettingPassword}
                    className={`w-full rounded-lg border bg-background px-3 py-2.5 pr-11 text-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      confirmResetPassword.length === 0
                        ? "border-border focus:border-primary focus:ring-primary/20"
                        : resetPasswordsMatch
                        ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                        : "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmResetPassword(
                        (current) => !current
                      )
                    }
                    disabled={resettingPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      showConfirmResetPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-label={
                      showConfirmResetPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showConfirmResetPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                {confirmResetPassword.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      resetPasswordsMatch
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {resetPasswordsMatch
                      ? "✓ As senhas coincidem."
                      : "✕ As senhas não coincidem."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeResetPassword}
                disabled={resettingPassword}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={
                  resettingPassword ||
                  !resetPasswordStrong ||
                  !resetPasswordsMatch
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound size={15} />

                {resettingPassword
                  ? "Redefinindo..."
                  : "Redefinir senha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR FUNÇÃO */}

      {userToChangeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  Alterar função?
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Deseja alterar o usuário{" "}
                  <span className="font-semibold text-gray-200">
                    {userToChangeRole.username}
                  </span>{" "}
                  para{" "}
                  <span className="font-semibold text-gray-200">
                    {userToChangeRole.role === "admin"
                      ? "Usuário"
                      : "Administrador"}
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {userToChangeRole.role === "admin"
                  ? "O usuário perderá as permissões administrativas."
                  : "O usuário passará a ter acesso às funções administrativas do sistema."}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setUserToChangeRole(null)
                }
                disabled={changingRole}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleChangeRole}
                disabled={changingRole}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck size={15} />

                {changingRole
                  ? "Alterando..."
                  : "Sim, alterar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR USUÁRIO */}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <Trash2 size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  Excluir usuário?
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Tem certeza de que deseja excluir o usuário{" "}
                  <span className="font-semibold text-gray-200">
                    {userToDelete.username}
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-sm text-red-500">
                Essa ação é permanente e não poderá ser desfeita.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />

                {deletingUser
                  ? "Excluindo..."
                  : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}