import { useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Network,
  Play,
  SlidersHorizontal,
} from "lucide-react";

import type { InputSchema } from "../types/schema";

interface PredictionFormProps {
  schema: InputSchema;
  onSubmit: (
    payload: Record<string, string | number>
  ) => void;
  submitting: boolean;
}

function buildInitialValues(
  schema: InputSchema
): Record<string, string | number> {
  const values: Record<string, string | number> = {};

  for (const feature of schema.features) {
    values[feature.name] =
      feature.type === "categorical"
        ? feature.allowed_values[0]
        : feature.example;
  }

  return values;
}

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFieldDescription(
  name: string,
  type: string
): string {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("duration")) {
    return "Tempo de duração da conexão.";
  }

  if (
    normalizedName.includes("bytes") ||
    normalizedName.includes("packet") ||
    normalizedName.includes("count")
  ) {
    return "Quantidade observada durante a conexão.";
  }

  if (
    normalizedName.includes("rate") ||
    normalizedName.includes("ratio") ||
    normalizedName.includes("percent")
  ) {
    return "Taxa ou proporção calculada para a conexão.";
  }

  if (type === "categorical") {
    return "Selecione a característica observada na conexão.";
  }

  return "Informe o valor observado no tráfego de rede.";
}

export function PredictionForm({
  schema,
  onSubmit,
  submitting,
}: PredictionFormProps) {
  const [values, setValues] = useState<
    Record<string, string | number>
  >(() => buildInitialValues(schema));

  const [showAdvanced, setShowAdvanced] = useState(false);

  const categoricalFeatures = schema.features.filter(
    (feature) => feature.type === "categorical"
  );

  const numericFeatures = schema.features.filter(
    (feature) => feature.type !== "categorical"
  );

  function handleChange(
    name: string,
    value: string,
    isNumeric: boolean
  ) {
    setValues((prev) => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Network size={22} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100">
              Nova análise de conexão
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Informe as características da conexão. Os campos já
              vêm preenchidos com valores de exemplo para facilitar
              os testes.
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-100">
            {schema.features.length}
          </p>

          <p className="text-xs text-muted-foreground">
            características
          </p>
        </div>
      </div>

      {/* Características principais */}
      {categoricalFeatures.length > 0 && (
        <section className="rounded-xl border border-border bg-background/30">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Network size={18} />
              </div>

              <div>
                <h3 className="font-semibold text-gray-100">
                  Características da conexão
                </h3>

                <p className="text-xs text-muted-foreground">
                  Informações sobre o tipo e comportamento da conexão.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            {categoricalFeatures.map((feature) => (
              <div key={feature.name}>
                <label
                  htmlFor={feature.name}
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200"
                >
                  {formatFeatureName(feature.name)}

                  <span
                    title={getFieldDescription(
                      feature.name,
                      feature.type
                    )}
                    className="cursor-help text-muted-foreground"
                  >
                    <CircleHelp size={14} />
                  </span>
                </label>

                <select
                  id={feature.name}
                  value={values[feature.name]}
                  onChange={(event) =>
                    handleChange(
                      feature.name,
                      event.target.value,
                      false
                    )
                  }
                  disabled={submitting}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {feature.allowed_values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {getFieldDescription(
                    feature.name,
                    feature.type
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Métricas avançadas */}
      {numericFeatures.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border bg-background/30">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-hover/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity size={18} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-100">
                    Métricas do tráfego
                  </h3>

                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                    {numericFeatures.length} campos
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Valores numéricos utilizados pelo modelo na análise.
                </p>
              </div>
            </div>

            {showAdvanced ? (
              <ChevronUp
                size={20}
                className="text-muted-foreground"
              />
            ) : (
              <ChevronDown
                size={20}
                className="text-muted-foreground"
              />
            )}
          </button>

          {showAdvanced && (
            <div className="border-t border-border p-5">
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                <SlidersHorizontal
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Esses valores são características quantitativas
                  extraídas do tráfego de rede. Caso você esteja
                  realizando um teste, os valores de exemplo podem
                  ser mantidos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {numericFeatures.map((feature) => (
                  <div key={feature.name}>
                    <label
                      htmlFor={feature.name}
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200"
                    >
                      {formatFeatureName(feature.name)}

                      <span
                        title={getFieldDescription(
                          feature.name,
                          feature.type
                        )}
                        className="cursor-help text-muted-foreground"
                      >
                        <CircleHelp size={14} />
                      </span>
                    </label>

                    <input
                      id={feature.name}
                      type="number"
                      step="any"
                      value={values[feature.name]}
                      onChange={(event) =>
                        handleChange(
                          feature.name,
                          event.target.value,
                          true
                        )
                      }
                      disabled={submitting}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {getFieldDescription(
                        feature.name,
                        feature.type
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Rodapé da análise */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">
            Pronto para analisar?
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            O modelo avaliará os dados e classificará o tráfego.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play size={16} />

          {submitting
            ? "Analisando conexão..."
            : "Analisar conexão"}
        </button>
      </div>
    </form>
  );
}
