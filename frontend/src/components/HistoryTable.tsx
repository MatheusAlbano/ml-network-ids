import { RiskBadge } from "./RiskBadge";
import type { AnalysisHistoryItem } from "../types/history";

export function HistoryTable({ items }: { items: AnalysisHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 text-sm">
        Nenhuma análise encontrada para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-border">
            <th className="py-2.5 px-3 font-medium">Data/Hora</th>
            <th className="py-2.5 px-3 font-medium">Classe</th>
            <th className="py-2.5 px-3 font-medium">Prob. Ataque</th>
            <th className="py-2.5 px-3 font-medium">Risco</th>
            <th className="py-2.5 px-3 font-medium">Modelo</th>
            <th className="py-2.5 px-3 font-medium">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/50 hover:bg-surface-hover">
              <td className="py-2.5 px-3 text-gray-400">
                {new Date(item.timestamp).toLocaleString("pt-BR")}
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={
                    item.predicted_class === "Ataque"
                      ? "text-danger font-medium"
                      : "text-success font-medium"
                  }
                >
                  {item.predicted_class}
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-300">
                {(item.probability_attack * 100).toFixed(2)}%
              </td>
              <td className="py-2.5 px-3">
                <RiskBadge level={item.risk_level} />
              </td>
              <td className="py-2.5 px-3 text-gray-400">{item.model_used}</td>
              <td className="py-2.5 px-3 text-gray-400">
                {item.inference_time_ms > 0 ? `${item.inference_time_ms.toFixed(1)}ms` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}