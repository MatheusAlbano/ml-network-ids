import { Activity, ShieldAlert, ShieldCheck, TrendingUp, Gauge, Target } from "lucide-react";
import { Header } from "../components/Header";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

export function DashboardPage() {
  const { data, loading, error } = useDashboardSummary();

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral do sistema" />

      <div className="p-8">
        {loading && <LoadingState label="Carregando métricas..." />}
        {error && <ErrorState message={`Falha ao carregar dashboard: ${error}`} />}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
              <MetricCard
                label="F1-score do Modelo"
                value={`${(data.model_f1_score * 100).toFixed(2)}%`}
                icon={Target}
                accentColor="primary"
              />
              <MetricCard
                label="ROC-AUC do Modelo"
                value={`${(data.model_roc_auc * 100).toFixed(2)}%`}
                icon={Gauge}
                accentColor="primary"
              />
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Modelo em Produção
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Algoritmo</span>
                <span className="text-gray-200 font-medium">{data.model_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Última análise</span>
                <span className="text-gray-200 font-medium">
                  {data.last_analysis_at
                    ? new Date(data.last_analysis_at).toLocaleString("pt-BR")
                    : "Nenhuma análise realizada ainda"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}