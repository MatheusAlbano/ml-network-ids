import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Gauge,
  Target,
  BrainCircuit,
  Clock3,
} from "lucide-react";

import { Header } from "../components/Header";

import { MetricCard } from "../components/MetricCard";

import { LoadingState } from "../components/LoadingState";

import { ErrorState } from "../components/ErrorState";

import { useDashboardSummary } from "../hooks/useDashboardSummary";

import { useToast } from "../components/ToastContext";

import { useEffect } from "react";

export function DashboardPage() {
  const { data, loading, error } = useDashboardSummary();

  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(
        `Falha ao carregar dashboard: ${error}`,
        "error"
      );
    }
  }, [error, showToast]);

  const normalPercentage =
    data && data.total_analyses > 0
      ? (data.total_normal / data.total_analyses) * 100
      : 0;

  const attackPercentage =
    data && data.total_analyses > 0
      ? (data.total_attacks / data.total_analyses) * 100
      : 0;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Visão geral da atividade de detecção de intrusão"
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {loading && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <LoadingState label="Carregando métricas do sistema..." />
          </div>
        )}

        {error && (
          <ErrorState
            message={`Falha ao carregar dashboard: ${error}`}
          />
        )}

        {data && (
          <>
            {/* Métricas principais */}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  Atividade de detecção
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Resumo das análises realizadas por você.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total de Análises"
                  value={data.total_analyses.toLocaleString("pt-BR")}
                  icon={Activity}
                  accentColor="primary"
                />

                <MetricCard
                  label="Ataques Detectados"
                  value={data.total_attacks.toLocaleString("pt-BR")}
                  icon={ShieldAlert}
                  accentColor="danger"
                />

                <MetricCard
                  label="Tráfego Normal"
                  value={data.total_normal.toLocaleString("pt-BR")}
                  icon={ShieldCheck}
                  accentColor="success"
                />

                <MetricCard
                  label="Taxa de Ataques"
                  value={`${(data.attack_rate * 100).toFixed(1)}%`}
                  icon={TrendingUp}
                  accentColor="warning"
                />
              </div>
            </section>

            {/* Distribuição + modelo */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Distribuição */}

              <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-100">
                      Distribuição das análises
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Classificação das conexões analisadas.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity size={20} />
                  </div>
                </div>

                {data.total_analyses === 0 ? (
                  <div className="mt-8 rounded-lg border border-border bg-background p-6 text-center">
                    <p className="text-sm font-medium text-gray-200">
                      Nenhuma análise realizada
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Realize uma predição para começar a visualizar
                      os dados.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                          <span className="text-sm font-medium text-gray-200">
                            Tráfego normal
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-green-500">
                          {normalPercentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{
                            width: `${normalPercentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {data.total_normal.toLocaleString("pt-BR")}{" "}
                        conexões classificadas como normais.
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                          <span className="text-sm font-medium text-gray-200">
                            Ataques detectados
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-red-500">
                          {attackPercentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{
                            width: `${attackPercentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {data.total_attacks.toLocaleString("pt-BR")}{" "}
                        conexões classificadas como ataques.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Modelo */}

              <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-100">
                      Modelo em produção
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Informações sobre o modelo utilizado nas
                      predições.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BrainCircuit size={20} />
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Algoritmo
                      </p>

                      <p className="mt-1 text-base font-semibold text-gray-100">
                        {data.model_name}
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500">
                      <span className="h-2 w-2 rounded-full bg-green-500" />

                      Operacional
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <Target
                      size={17}
                      className="mx-auto mb-2 text-primary"
                    />

                    <p className="text-lg font-bold text-gray-100">
                      {(data.model_accuracy * 100).toFixed(2)}%
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Accuracy
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <Target
                      size={17}
                      className="mx-auto mb-2 text-primary"
                    />

                    <p className="text-lg font-bold text-gray-100">
                      {(data.model_f1_score * 100).toFixed(2)}%
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      F1-score
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <Gauge
                      size={17}
                      className="mx-auto mb-2 text-primary"
                    />

                    <p className="text-lg font-bold text-gray-100">
                      {(data.model_roc_auc * 100).toFixed(2)}%
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ROC-AUC
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Informações da última análise */}

            <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock3 size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-100">
                    Atividade recente
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Informações sobre a última análise realizada.
                  </p>

                  <div className="mt-5 flex flex-col gap-4 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Última análise
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-gray-100">
                        {data.last_analysis_at
                          ? new Date(
                              data.last_analysis_at
                            ).toLocaleString("pt-BR")
                          : "Nenhuma análise realizada ainda"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        Total processado
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-100">
                        {data.total_analyses.toLocaleString("pt-BR")}{" "}
                        análises
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}