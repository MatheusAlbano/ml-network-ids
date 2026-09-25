import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import { register } from "../services/auth";

import { useToast } from "../components/ToastContext";

import {
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

export function RegisterPage() {
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const navigate = useNavigate();

  const { showToast } = useToast();

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passwordScore = Object.values(
    passwordRequirements
  ).filter(Boolean).length;

  const passwordStrong = passwordScore === 5;

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!passwordStrong) {
      showToast(
        "A senha deve atender a todos os requisitos de segurança.",
        "error"
      );

      return;
    }

    if (password !== confirmPassword) {
      showToast(
        "As senhas não coincidem.",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      await register(username, email, password);

      showToast(
        "Conta criada com sucesso. Redirecionando para o login...",
        "success"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Erro ao criar conta:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast(
          "Não foi possível criar a conta.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus size={24} />
          </div>

          <h1 className="text-2xl font-bold text-gray-100">
            Criar conta
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre-se para utilizar o ML Network IDS
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Nome de usuário
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="seu_usuario"
              required
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-200"
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
              placeholder="voce@email.com"
              required
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Senha
            </label>

            <div className="relative">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Digite sua senha"
                minLength={8}
                required
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? (
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
                      passwordStrong
                        ? "text-green-500"
                        : passwordScore >= 3
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrong
                      ? "Forte"
                      : passwordScore >= 3
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
                        level <= passwordScore
                          ? passwordStrong
                            ? "bg-green-500"
                            : passwordScore >= 3
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
                    passwordRequirements.length
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordRequirements.length
                    ? "✓"
                    : "○"}{" "}
                  Pelo menos 8 caracteres
                </p>

                <p
                  className={`text-xs ${
                    passwordRequirements.uppercase
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordRequirements.uppercase
                    ? "✓"
                    : "○"}{" "}
                  Pelo menos uma letra maiúscula
                </p>

                <p
                  className={`text-xs ${
                    passwordRequirements.lowercase
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordRequirements.lowercase
                    ? "✓"
                    : "○"}{" "}
                  Pelo menos uma letra minúscula
                </p>

                <p
                  className={`text-xs ${
                    passwordRequirements.number
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordRequirements.number
                    ? "✓"
                    : "○"}{" "}
                  Pelo menos um número
                </p>

                <p
                  className={`text-xs ${
                    passwordRequirements.symbol
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordRequirements.symbol
                    ? "✓"
                    : "○"}{" "}
                  Pelo menos um símbolo
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Confirmar senha
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Digite a senha novamente"
                minLength={8}
                required
                disabled={loading}
                className={`w-full rounded-lg border bg-background px-3 py-2.5 pr-11 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmPassword.length === 0
                    ? "border-border focus:border-primary focus:ring-primary/20"
                    : passwordsMatch
                    ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                    : "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  showConfirmPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
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

            {confirmPassword.length > 0 && (
              <p
                className={`mt-2 text-xs ${
                  passwordsMatch
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {passwordsMatch
                  ? "✓ As senhas coincidem."
                  : "✕ As senhas não coincidem."}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !passwordStrong ||
              !passwordsMatch
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} />

            {loading
              ? "Criando conta..."
              : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já possui uma conta?{" "}

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-primary hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}