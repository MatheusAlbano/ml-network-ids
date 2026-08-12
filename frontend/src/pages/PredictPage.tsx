import { useState } from "react";
import { Header } from "../components/Header";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { PredictionForm } from "../components/PredictionForm";
import { PredictionResultCard } from "../components/PredictionResultCard";
import { useInputSchema } from "../hooks/useInputSchema";
import { predictConnection } from "../services/predictService";
import type { PredictionResult } from "../types/prediction";

export function PredictPage() {
  const { schema, loading, error } = useInputSchema();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(payload: Record<string, string | number>) {
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const prediction = await predictConnection(payload);
      setResult(prediction);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header title="Predição" subtitle="Analisar uma conexão de rede" />

      <div className="p-8 space-y-6">
        {loading && <LoadingState label="Carregando formulário..." />}
        {error && <ErrorState message={`Falha ao carregar schema: ${error}`} />}

        {schema && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <PredictionForm schema={schema} onSubmit={handleSubmit} submitting={submitting} />
          </div>
        )}

        {submitError && <ErrorState message={`Falha na predição: ${submitError}`} />}
        {result && <PredictionResultCard result={result} />}
      </div>
    </>
  );
}