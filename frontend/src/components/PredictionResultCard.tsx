import { ShieldAlert, ShieldCheck, Clock, Cpu } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import type { PredictionResult } from "../types/prediction";

export function PredictionResultCard({ result }: { result: PredictionResult }) {
  const isAttack = result.predicted_class === "Ataque";

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAttack ? (
            <ShieldAlert className="text-danger" size={28} />
          ) : (
            <ShieldCheck className="text-success" size={28} />
          )}
          <div>
            <p className={`text-lg font-bold ${isAttack ? "text-danger" : "text-success"}`}>
              {result.predicted_class}
            </p>
            <p className="text-xs text-gray-500">Classificação da conexão</p>
          </div>
        </div>
        <RiskBadge level={result.risk_level} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Probabilidade Normal</p>
          <p className="text-lg font-semibold text-gray-100">
            {(result.probability_normal * 100).toFixed(2)}%
          </p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Probabilidade Ataque</p>
          <p className="text-lg font-semibold text-gray-100">
            {(result.probability_attack * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Cpu size={14} /> {result.model_used}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} /> {result.inference_time_ms.toFixed(2)}ms
        </span>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">
          Por que o sistema decidiu isso?
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">{result.explanation_text}</p>

        <div className="mt-4 space-y-2">
          {result.top_features.map((f) => (
            <div key={f.feature} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {f.feature} = <span className="text-gray-200">{String(f.value)}</span>
              </span>
              <span className={f.direction === "aumenta" ? "text-danger" : "text-success"}>
                {f.direction === "aumenta" ? "▲" : "▼"} {Math.abs(f.contribution).toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}