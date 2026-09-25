import {
  BarChart3,
  BrainCircuit,
  ChartNoAxesCombined,
  GitBranch,
  Target,
} from "lucide-react";

import { Header } from "../components/Header";

import { LoadingState } from "../components/LoadingState";

import { ErrorState } from "../components/ErrorState";

import { ConfusionMatrixGrid } from "../components/ConfusionMatrixGrid";

import { ROCCurveChart } from "../components/ROCCurveChart";

import { PrecisionRecallChart } from "../components/PrecisionRecallChart";

import { FeatureImportanceChart } from "../components/FeatureImportanceChart";

import { useStatistics } from "../hooks/useStatistics";

function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

export function StatisticsPage() {
  const {
    data,
    loading,
    error,
  } = useStatistics();

  return (
    <>
      <Header
        title="Estatísticas"
        subtitle="Avaliação e desempenho do modelo de Machine Learning"
      />

      <div className="space-y-6 p-8">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit size={22} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Avaliação do modelo
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Visualize diferentes métricas utilizadas para avaliar o
                comportamento do modelo na classificação de conexões de
                rede, incluindo desempenho, capacidade de discriminação
                e influência das características utilizadas na análise.
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <LoadingState label="Carregando estatísticas..." />
          </section>
        )}

        {error && (
          <ErrorState
            message={`Falha ao carregar estatísticas: ${error}`}
          />
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel
                icon={GitBranch}
                title="Matriz de Confusão"
                description="Mostra como as classificações realizadas pelo modelo se distribuem entre as classes."
              >
                <ConfusionMatrixGrid
                  matrix={data.confusionMatrix}
                />
              </Panel>

              <Panel
                icon={BarChart3}
                title="Importância das Features (SHAP)"
                description="Apresenta a contribuição das características de entrada para as decisões do modelo."
              >
                <FeatureImportanceChart
                  data={data.featureImportance}
                />
              </Panel>

              <Panel
                icon={ChartNoAxesCombined}
                title="Curva ROC"
                description="Representa a capacidade do modelo de distinguir entre conexões normais e ataques."
              >
                <ROCCurveChart
                  data={data.rocCurve}
                />
              </Panel>

              <Panel
                icon={Target}
                title="Curva Precision-Recall"
                description="Permite analisar a relação entre precisão e revocação na identificação de ataques."
              >
                <PrecisionRecallChart
                  data={data.prCurve}
                />
              </Panel>
            </div>

            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BrainCircuit size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-200">
                    Sobre estas métricas
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Os gráficos apresentados são utilizados para analisar
                    diferentes aspectos do desempenho do modelo. A matriz
                    de confusão detalha os acertos e erros de classificação,
                    enquanto as curvas ROC e Precision-Recall permitem
                    observar o comportamento do classificador em diferentes
                    limiares. A análise SHAP complementa essa avaliação ao
                    indicar a influência das características utilizadas pelo
                    modelo.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}