import { useState } from "react";

import {
  UploadCloud,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Header } from "../components/Header";

import { FileDropZone } from "../components/FileDropZone";

import { ProgressBar } from "../components/ProgressBar";

import { ErrorState } from "../components/ErrorState";

import { BatchResultSummary } from "../components/BatchResultSummary";

import { predictBatch } from "../services/batchService";

import type { BatchPredictionResponse } from "../types/batch";

import { useToast } from "../components/ToastContext";

export function BatchPage() {
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] =
    useState<BatchPredictionResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  async function handleUpload() {
    if (!file) {
      showToast(
        "Selecione um arquivo CSV antes de processar.",
        "warning"
      );

      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await predictBatch(file);

      setResult(response);

      showToast(
        "Arquivo processado com sucesso.",
        "success"
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro desconhecido";

      setError(message);

      showToast(
        `Falha ao processar o arquivo: ${message}`,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Upload CSV"
        subtitle="Análise em lote de múltiplas conexões"
      />

      <div className="space-y-6 p-8">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UploadCloud size={22} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-100">
                  Análise em lote
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Envie um arquivo CSV contendo múltiplas conexões
                  de rede para que o modelo realize as classificações
                  automaticamente.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 text-center">
              <FileText
                size={18}
                className="mx-auto text-primary"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Formato
              </p>

              <p className="text-sm font-semibold text-gray-100">
                CSV
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Selecionar arquivo
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Selecione ou arraste o arquivo CSV que será enviado
                para análise.
              </p>
            </div>
          </div>

          <FileDropZone
            selectedFile={file}
            onFileSelect={setFile}
          />

          {!submitting && (
            <div className="mt-5 flex flex-col gap-4 rounded-lg border border-border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Pronto para processar
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    O modelo analisará cada conexão presente no
                    arquivo selecionado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Processar arquivo

                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {submitting && (
            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <ProgressBar label="Processando arquivo..." />
            </div>
          )}
        </section>

        {error && (
          <ErrorState
            message={`Falha no processamento: ${error}`}
          />
        )}

        {result && (
          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-200">
                    Resultado da análise
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Resumo das classificações realizadas pelo modelo.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <BatchResultSummary result={result} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
