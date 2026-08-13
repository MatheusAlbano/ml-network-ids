import { Cpu, Palette, Globe, SlidersHorizontal } from "lucide-react";
import { Header } from "../components/Header";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { ThresholdSlider } from "../components/ThresholdSlider";
import { useSettings } from "../hooks/useSettings";
import { useStatusQuery } from "../hooks/useStatusQuery";

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { threshold, setThreshold, resetThreshold } = useSettings();
  const { data, loading, error } = useStatusQuery();

  return (
    <>
      <Header title="Configurações" subtitle="Preferências do sistema" />

      <div className="p-8 max-w-2xl space-y-4">
        <SettingsSection icon={SlidersHorizontal} title="Limiar de Classificação">
          <ThresholdSlider value={threshold} onChange={setThreshold} onReset={resetThreshold} />
        </SettingsSection>

        <SettingsSection icon={Cpu} title="Modelo em Produção">
          {loading && <LoadingState label="Carregando informações do modelo..." />}
          {error && <ErrorState message={error} />}
          {data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Algoritmo</span>
                <span className="text-gray-200">{data.model_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">F1-score</span>
                <span className="text-gray-200">
                  {(data.model_metrics.test_f1_score * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ROC-AUC</span>
                <span className="text-gray-200">
                  {(data.model_metrics.test_roc_auc * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-3">
            A troca entre modelos treinados (comparados na etapa de desenvolvimento) não está
            disponível nesta versão do sistema — trabalho futuro sugerido para expansão do MVP.
          </p>
        </SettingsSection>

        <SettingsSection icon={Palette} title="Tema">
          <p className="text-sm text-gray-300">Escuro (dark mode)</p>
          <p className="text-xs text-gray-600 mt-1">
            Atualmente o sistema suporta apenas o tema escuro, adequado ao uso prolongado por
            analistas de segurança. Suporte a tema claro é uma extensão futura possível.
          </p>
        </SettingsSection>

        <SettingsSection icon={Globe} title="Idioma">
          <p className="text-sm text-gray-300">Português (Brasil)</p>
          <p className="text-xs text-gray-600 mt-1">
            Suporte a múltiplos idiomas não implementado nesta versão — trabalho futuro sugerido.
          </p>
        </SettingsSection>
      </div>
    </>
  );
}