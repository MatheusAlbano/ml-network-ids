import { useState } from "react";
import { Header } from "../components/Header";
import { FileDropZone } from "../components/FileDropZone";
import { ProgressBar } from "../components/ProgressBar";
import { ErrorState } from "../components/ErrorState";
import { BatchResultSummary } from "../components/BatchResultSummary";
import { predictBatch } from "../services/batchService";
import type { BatchPredictionResponse } from "../types/batch";

export function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BatchPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await predictBatch(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header title="Upload CSV" subtitle="Análise em lote de múltiplas conexões" />

      <div className="p-8 space-y-6">
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <FileDropZone selectedFile={file} onFileSelect={setFile} />

          {submitting && <ProgressBar label="Processando arquivo..." />}

          {!submitting && (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Processar Arquivo
            </button>
          )}
        </div>

        {error && <ErrorState message={`Falha no processamento: ${error}`} />}

        {result && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <BatchResultSummary result={result} />
          </div>
        )}
      </div>
    </>
  );
}