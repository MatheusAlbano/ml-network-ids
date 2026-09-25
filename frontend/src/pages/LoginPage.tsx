import React, { useState } from "react";

import {
  Radar,
  ShieldCheck,
  Activity,
} from "lucide-react";

import { login } from "../services/auth";

import { useNavigate } from "react-router-dom";

import { useToast } from "../components/ToastContext";

export function LoginPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { showToast } = useToast();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      const data = await login(email, password);

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      showToast(
        "Login realizado com sucesso.",
        "success"
      );

      navigate("/");
    } catch {
      showToast(
        "E-mail ou senha inválidos.",
        "error"
      );
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Radar size={30} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-100">
            ML Network IDS
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sistema de Detecção de Intrusão
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8">
          <div className="mb-7">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={18}
                className="text-primary"
              />

              <h2 className="text-base font-semibold text-gray-100">
                Acesso ao sistema
              </h2>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Entre com suas credenciais para acessar o
              ambiente de monitoramento e análise.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
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
                placeholder="Digite seu e-mail"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Senha
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Activity size={17} />

              Entrar no sistema
            </button>
          </form>

          <div className="my-6 border-t border-border" />

          <div className="text-center text-sm text-muted-foreground">
            Ainda não tem uma conta?{" "}

            <button
              type="button"
              onClick={() => navigate("/cadastro")}
              className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              Cadastre-se
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
          <ShieldCheck size={14} />

          <span>
            Ambiente protegido por autenticação
          </span>
        </div>

        <p className="mt-2 text-center text-xs text-gray-700">
          TCC — UNIFAJ · 2026
        </p>
      </div>
    </div>
  );
}