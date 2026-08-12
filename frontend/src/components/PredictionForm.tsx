import { useState } from "react";
import type { InputSchema } from "../types/schema";

interface PredictionFormProps {
  schema: InputSchema;
  onSubmit: (payload: Record<string, string | number>) => void;
  submitting: boolean;
}

function buildInitialValues(schema: InputSchema): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  for (const feature of schema.features) {
    values[feature.name] =
      feature.type === "categorical" ? feature.allowed_values[0] : feature.example;
  }
  return values;
}

export function PredictionForm({ schema, onSubmit, submitting }: PredictionFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    buildInitialValues(schema)
  );

  function handleChange(name: string, value: string, isNumeric: boolean) {
    setValues((prev) => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schema.features.map((feature) => (
          <div key={feature.name}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {feature.name}
            </label>

            {feature.type === "categorical" ? (
              <select
                value={values[feature.name]}
                onChange={(e) => handleChange(feature.name, e.target.value, false)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {feature.allowed_values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                step="any"
                value={values[feature.name]}
                onChange={(e) => handleChange(feature.name, e.target.value, true)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        {submitting ? "Analisando..." : "Analisar Conexão"}
      </button>
    </form>
  );
}