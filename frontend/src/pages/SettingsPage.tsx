import { useEffect } from "react";

import {
  Cpu,
  Palette,
  Globe,
  SlidersHorizontal,
  ShieldCheck,
  Target,
  Gauge,
} from "lucide-react";

import { Header } from "../components/Header";

import { LoadingState } from "../components/LoadingState";

import { ErrorState } from "../components/ErrorState";

import { ThresholdSlider } from "../components/ThresholdSlider";

import { useSettings } from "../hooks/useSettings";

import { useStatusQuery } from "../hooks/useStatusQuery";

import { useToast } from "../components/ToastContext";

function SettingsSection({
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
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-100">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

export function SettingsPage() {
  const {
    threshold,
    setThreshold,
    resetThreshold,
  } = useSettings();

  const {
    data,
    loading,
    error,
  } = useStatusQuery();

  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(
        `Falha ao carregar informações do modelo: ${error}`,
        "error"
      );
    }
  }, [error, showToast]);

  function handleResetThreshold() {
    resetThreshold();

    showToast(
      "Limiar de classificação restaurado para o valor padrão.",
      "success"
    );
  }

  return (
    <>
      <Header
        title="Configurações"
        subtitle="Preferências e parâmetros da análise"
      />

      <div className="p-8 space-y-6">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SlidersHorizontal size={22} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-100">
                  Parâmetros da detecção
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Ajuste o comportamento da classificação das conexões
                  sem alterar o modelo de Machine Learning utilizado pelo
                  sistema.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Limiar atual
              </p>

              <p className="mt-1 text-xl font-bold text-gray-100">
                {(threshold * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </section>

        <SettingsSection
          icon={SlidersHorizontal}
          title="Limiar de Classificação"
          description="Define a probabilidade mínima necessária para que uma conexão seja classificada como ataque."
        >
          <div className="rounded-lg border border-border bg-background p-5">
            <ThresholdSlider
              value={threshold}
              onChange={setThreshold}
              onReset={handleResetThreshold}
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-primary"
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              Um limiar mais baixo tende a tornar a detecção mais
              sensível, enquanto um limiar mais alto exige maior
              confiança do modelo antes de classificar uma conexão como
              ataque.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Cpu}
          title="Modelo em Produção"
          description="Informações sobre o modelo atualmente utilizado pelo sistema."
        >
          {loading && (
            <div className="rounded-lg border border-border bg-background p-5">
              <LoadingState
                label="Carregando informações do modelo..."
              />
            </div>
          )}

          {error && <ErrorState message={error} />}

          {data && (
            <>
              <div className="rounded-lg border border-border bg-background p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Algoritmo
                    </p>

                    <p className="mt-1 text-lg font-semibold text-gray-100">
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
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Accuracy
                    </p>

                    <ShieldCheck
                      size={17}
                      className="text-primary"
                    />
                  </div>

                  <p className="mt-3 text-xl font-bold text-gray-100">
                    {(data.model_metrics.test_accuracy * 100).toFixed(
                      2
                    )}
                    %
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      F1-score
                    </p>

                    <Target
                      size={17}
                      className="text-primary"
                    />
                  </div>

                  <p className="mt-3 text-xl font-bold text-gray-100">
                    {(data.model_metrics.test_f1_score * 100).toFixed(
                      2
                    )}
                    %
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      ROC-AUC
                    </p>

                    <Gauge
                      size={17}
                      className="text-primary"
                    />
                  </div>

                  <p className="mt-3 text-xl font-bold text-gray-100">
                    {(data.model_metrics.test_roc_auc * 100).toFixed(
                      2
                    )}
                    %
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              A troca entre modelos treinados e comparados durante a
              etapa de desenvolvimento não está disponível nesta versão
              do sistema. Essa funcionalidade pode ser incorporada em
              uma futura expansão do MVP.
            </p>
          </div>
        </SettingsSection>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SettingsSection
            icon={Palette}
            title="Tema"
            description="Configuração visual da interface."
          >
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Tema escuro
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Interface atualmente configurada para modo escuro.
                </p>
              </div>

              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-300">
                Ativo
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              O suporte a um tema claro pode ser incorporado em uma
              futura versão do sistema.
            </p>
          </SettingsSection>

          <SettingsSection
            icon={Globe}
            title="Idioma"
            description="Idioma utilizado pelos textos da interface."
          >
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Português (Brasil)
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Idioma atualmente utilizado pela aplicação.
                </p>
              </div>

              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-300">
                Ativo
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              O suporte a múltiplos idiomas não está implementado nesta
              versão.
            </p>
          </SettingsSection>
        </div>

        <div className="rounded-xl border border-border bg-surface px-6 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            As configurações disponíveis nesta tela afetam apenas as
            preferências e o comportamento da interface de análise. O
            modelo treinado permanece inalterado.
          </p>
        </div>
      </div>
    </>
  );
}
