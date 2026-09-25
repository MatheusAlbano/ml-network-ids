import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Shield,
  User,
  LogOut,
  Save,
  X,
  LockKeyhole,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { Header } from "../components/Header";

import { useToast } from "../components/ToastContext";

import {
  changePassword,
  getMe,
  updateProfile,
} from "../services/auth";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
}

export function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");

  const [usernameLoading, setUsernameLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordError, setPasswordError] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const navigate = useNavigate();

  const { showToast } = useToast();

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getMe();

        setUser(data);

        setUsernameInput(data.username);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");

    navigate("/login");
  }

  function handleStartUsernameEdit() {
    if (!user) {
      return;
    }

    setUsernameInput(user.username);

    setUsernameError("");

    setEditingUsername(true);
  }

  function handleCancelUsernameEdit() {
    if (usernameLoading) {
      return;
    }

    setUsernameInput(user?.username || "");

    setUsernameError("");

    setEditingUsername(false);
  }

  async function handleUpdateUsername(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setUsernameError("");

    const newUsername = usernameInput.trim();

    if (newUsername.length < 3) {
      setUsernameError(
        "O nome de usuário deve ter pelo menos 3 caracteres."
      );

      return;
    }

    if (newUsername === user?.username) {
      setEditingUsername(false);

      return;
    }

    setUsernameLoading(true);

    try {
      const response = await updateProfile(newUsername);

      setUser((current) =>
        current
          ? {
              ...current,
              username: response.username,
            }
          : current
      );

      setUsernameInput(response.username);

      setEditingUsername(false);

      showToast(
        "Nome de usuário atualizado com sucesso.",
        "success"
      );
    } catch (error) {
      setUsernameError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o nome de usuário."
      );
    } finally {
      setUsernameLoading(false);
    }
  }

  function resetPasswordForm() {
    setCurrentPassword("");

    setNewPassword("");

    setConfirmPassword("");

    setPasswordError("");

    setShowCurrentPassword(false);

    setShowNewPassword(false);

    setShowConfirmPassword(false);
  }

  function handleOpenPasswordForm() {
    resetPasswordForm();

    setShowPasswordForm(true);
  }

  function handleClosePasswordForm() {
    if (passwordLoading) {
      return;
    }

    resetPasswordForm();

    setShowPasswordForm(false);
  }

  function getPasswordStrength() {
    if (!newPassword) {
      return {
        label: "Digite uma senha",
        score: 0,
      };
    }

    let score = 0;

    if (newPassword.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(newPassword)) {
      score++;
    }

    if (/[a-z]/.test(newPassword)) {
      score++;
    }

    if (/[0-9]/.test(newPassword)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(newPassword)) {
      score++;
    }

    if (score <= 2) {
      return {
        label: "Senha fraca",
        score,
      };
    }

    if (score <= 4) {
      return {
        label: "Senha média",
        score,
      };
    }

    return {
      label: "Senha forte",
      score,
    };
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "A confirmação da nova senha não corresponde."
      );

      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "A nova senha deve ter pelo menos 8 caracteres."
      );

      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "A nova senha deve ser diferente da senha atual."
      );

      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changePassword(
        currentPassword,
        newPassword
      );

      resetPasswordForm();

      setShowPasswordForm(false);

      showToast(
        response.message || "Senha alterada com sucesso.",
        "success"
      );
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header
          title="Minha conta"
          subtitle="Dados da sua conta e segurança"
        />

        <div className="flex min-h-[400px] items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            Carregando informações da conta...
          </p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header
          title="Minha conta"
          subtitle="Dados da sua conta e segurança"
        />

        <div className="p-8">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-400">
              Não foi possível carregar os dados da sua conta.
            </p>
          </div>
        </div>
      </>
    );
  }

  const displayRole =
    user.role === "admin" ? "Administrador" : "Usuário";

  const initial = user.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  const passwordStrength = getPasswordStrength();

  return (
    <>
      <Header
        title="Minha conta"
        subtitle="Dados da sua conta e segurança"
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
              {initial}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-100">
                {user.username}
              </h2>

              <p className="mt-1 break-all text-sm text-muted-foreground">
                {user.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Shield size={13} />

                  {displayRole}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                  <CheckCircle2 size={13} />

                  Conta ativa
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Informações da conta
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Dados utilizados para identificar sua conta no sistema.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              {!editingUsername ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User size={16} />

                      <p className="text-xs">
                        Nome de usuário
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartUsernameEdit}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-100"
                      title="Editar nome de usuário"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>

                  <p className="mt-2 text-sm font-medium text-gray-100">
                    {user.username}
                  </p>

                  {usernameError && (
                    <p className="mt-2 text-xs text-red-400">
                      {usernameError}
                    </p>
                  )}
                </>
              ) : (
                <form onSubmit={handleUpdateUsername}>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={16} />

                    <p className="text-xs">
                      Nome de usuário
                    </p>
                  </div>

                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(event) =>
                      setUsernameInput(event.target.value)
                    }
                    minLength={3}
                    maxLength={50}
                    disabled={usernameLoading}
                    autoFocus
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  {usernameError && (
                    <p className="mt-2 text-xs text-red-400">
                      {usernameError}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelUsernameEdit}
                      disabled={usernameLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={14} />

                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={usernameLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={14} />

                      {usernameLoading
                        ? "Salvando..."
                        : "Salvar"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} />

                <p className="text-xs">
                  E-mail
                </p>
              </div>

              <p className="mt-2 break-all text-sm font-medium text-gray-100">
                {user.email}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                O e-mail não pode ser alterado por esta tela.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield size={16} />

                <p className="text-xs">
                  Função
                </p>
              </div>

              <p className="mt-2 text-sm font-medium text-gray-100">
                {displayRole}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 size={16} />

                <p className="text-xs">
                  Status
                </p>
              </div>

              <p
                className={`mt-2 text-sm font-medium ${
                  user.is_active
                    ? "text-green-500"
                    : "text-red-400"
                }`}
              >
                {user.is_active ? "Ativa" : "Inativa"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Segurança
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Gerencie as credenciais utilizadas para acessar o sistema.
              </p>
            </div>
          </div>

          {!showPasswordForm ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole size={18} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Senha da conta
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Mantenha sua senha forte e exclusiva para proteger sua conta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenPasswordForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <KeyRound size={16} />

                Alterar senha
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleChangePassword}
              className="rounded-xl border border-border bg-background p-5 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-100">
                    Alterar senha
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Atualize sua senha de acesso ao sistema.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm leading-relaxed text-red-400">
                    {passwordError}
                  </p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-2 block text-sm font-medium text-gray-200"
                  >
                    Senha atual
                  </label>

                  <div className="relative">
                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      disabled={passwordLoading}
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-11 text-sm text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gray-200"
                      aria-label={
                        showCurrentPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-gray-200"
                  >
                    Nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(event.target.value)
                      }
                      disabled={passwordLoading}
                      minLength={8}
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-11 text-sm text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gray-200"
                      aria-label={
                        showNewPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-300">
                          Força da senha
                        </p>

                        <p
                          className={`text-xs font-semibold ${
                            passwordStrength.label ===
                            "Senha forte"
                              ? "text-green-500"
                              : passwordStrength.label ===
                                  "Senha média"
                                ? "text-yellow-500"
                                : "text-red-400"
                          }`}
                        >
                          {passwordStrength.label}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((segment) => (
                          <div
                            key={segment}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength.score >= segment
                                ? passwordStrength.score === 5
                                  ? "bg-green-500"
                                  : passwordStrength.score >= 3
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                : "bg-surface-hover"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <p
                          className={`text-xs ${
                            newPassword.length >= 8
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {newPassword.length >= 8 ? "✓" : "○"}{" "}
                          Pelo menos 8 caracteres
                        </p>

                        <p
                          className={`text-xs ${
                            /[A-Z]/.test(newPassword)
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {/[A-Z]/.test(newPassword) ? "✓" : "○"}{" "}
                          Letra maiúscula
                        </p>

                        <p
                          className={`text-xs ${
                            /[a-z]/.test(newPassword)
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {/[a-z]/.test(newPassword) ? "✓" : "○"}{" "}
                          Letra minúscula
                        </p>

                        <p
                          className={`text-xs ${
                            /[0-9]/.test(newPassword)
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {/[0-9]/.test(newPassword) ? "✓" : "○"}{" "}
                          Número
                        </p>

                        <p
                          className={`text-xs ${
                            /[^A-Za-z0-9]/.test(newPassword)
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {/[^A-Za-z0-9]/.test(newPassword)
                            ? "✓"
                            : "○"}{" "}
                          Símbolo
                        </p>
                      </div>
                    </div>
                  )}

                  {!newPassword && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use pelo menos 8 caracteres, combinando letras,
                      números e símbolos.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-gray-200"
                  >
                    Confirmar nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={passwordLoading}
                      required
                      className={`w-full rounded-lg border bg-surface px-3 py-2.5 pr-11 text-sm text-gray-100 outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        confirmPassword &&
                        confirmPassword === newPassword
                          ? "border-green-500/40 focus:border-green-500 focus:ring-green-500/20"
                          : confirmPassword &&
                              confirmPassword !== newPassword
                            ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20"
                            : "border-border focus:border-primary focus:ring-primary/20"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gray-200"
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {confirmPassword && (
                    <p
                      className={`mt-2 text-xs ${
                        confirmPassword === newPassword
                          ? "text-green-500"
                          : "text-red-400"
                      }`}
                    >
                      {confirmPassword === newPassword
                        ? "✓ As senhas coincidem."
                        : "✕ As senhas não coincidem."}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClosePasswordForm}
                  disabled={passwordLoading}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    passwordLoading ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />

                  {passwordLoading
                    ? "Alterando senha..."
                    : "Alterar senha"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <LogOut size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-100">
                  Sessão
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Encerre sua sessão atual neste dispositivo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <LogOut size={16} />

              Sair da conta
            </button>
          </div>
        </section>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <LogOut size={20} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-100">
              Sair da conta?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sua sessão será encerrada neste dispositivo e será
              necessário entrar novamente para acessar o sistema.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-hover"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <LogOut size={15} />

                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}