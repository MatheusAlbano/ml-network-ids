import { Header } from "../components/Header";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { ConfusionMatrixGrid } from "../components/ConfusionMatrixGrid";
import { ROCCurveChart } from "../components/ROCCurveChart";
import { PrecisionRecallChart } from "../components/PrecisionRecallChart";
import { FeatureImportanceChart } from "../components/FeatureImportanceChart";
import { useStatistics } from "../hooks/useStatistics";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function StatisticsPage() {
  const { data, loading, error } = useStatistics();

  return (
    <>
      <Header title="Estatísticas" subtitle="Desempenho do modelo" />

      <div className="p-8">
        {loading && <LoadingState label="Carregando estatísticas..." />}
        {error && <ErrorState message={`Falha ao carregar estatísticas: ${error}`} />}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Matriz de Confusão">
              <ConfusionMatrixGrid matrix={data.confusionMatrix} />
            </Panel>

            <Panel title="Importância das Features (SHAP)">
              <FeatureImportanceChart data={data.featureImportance} />
            </Panel>

            <Panel title="Curva ROC">
              <ROCCurveChart data={data.rocCurve} />
            </Panel>

            <Panel title="Curva Precision-Recall">
              <PrecisionRecallChart data={data.prCurve} />
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}