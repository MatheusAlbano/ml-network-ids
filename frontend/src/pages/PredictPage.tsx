import { useState } from "react";

import { ShieldAlert, Sparkles } from "lucide-react";

import { Header } from "../components/Header";

import { LoadingState } from "../components/LoadingState";

import { ErrorState } from "../components/ErrorState";

import { PredictionForm } from "../components/PredictionForm";

import { PredictionResultCard } from "../components/PredictionResultCard";

import { useInputSchema } from "../hooks/useInputSchema";

import { predictConnection } from "../services/predictService";

import type { PredictionResult } from "../types/prediction";

import { useSettings } from "../hooks/useSettings";

import { useToast } from "../components/ToastContext";

export function PredictPage() {
  const { schema, loading, error } = useInputSchema();

  const [result, setResult] =
    useState<PredictionResult | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const { threshold } = useSettings();

  const { showToast } = useToast();

  async function handleSubmit(
    payload: Record<string, string | number>
  ) {
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const prediction = await predictConnection(
        payload,
        threshold
      );

      setResult(prediction);

      showToast(
        "Análise concluída com sucesso.",
        "success"
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro desconhecido";

      setSubmitError(message);

      showToast(
        `Falha ao realizar a predição: ${message}`,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Predição"
        subtitle="Analisar uma conexão de rede"
      />

      <div className="space-y-6 p-8">
        {/* Introdução */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldAlert size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-100">
                Análise de tráfego de rede
              </h2>

              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Utilize as características de uma conexão para
                verificar se o tráfego apresenta comportamento
                normal ou potencialmente malicioso.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1.5">
                  Modelo de Machine Learning
                </span>

                <span className="rounded-full border border-border bg-background px-3 py-1.5">
                  Análise individual
                </span>

                <span className="rounded-full border border-border bg-background px-3 py-1.5">
                  Detecção de intrusão
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carregamento do schema */}
        {loading && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <LoadingState label="Preparando formulário de análise..." />
          </div>
        )}

        {/* Erro do schema */}
        {error && (
          <ErrorState
            message={`Falha ao carregar os dados necessários para a predição: ${error}`}
          />
        )}

        {/* Formulário */}
        {schema && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <PredictionForm
              schema={schema}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        )}

        {/* Erro da predição */}
        {submitError && (
          <ErrorState
            message={`Falha ao realizar a predição: ${submitError}`}
          />
        )}

        {/* Resultado */}
        {result && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles size={18} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  Resultado da análise
                </h2>

                <p className="text-sm text-muted-foreground">
                  Classificação realizada pelo modelo de Machine
                  Learning.
                </p>
              </div>
            </div>

            <PredictionResultCard result={result} />
          </section>
        )}
      </div>
    </>
  );
}