import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { BatchPredictionResponse } from "../types/batch";

export function BatchResultSummary({ result }: { result: BatchPredictionResponse }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-hover rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total de Linhas</p>
          <p className="text-xl font-bold text-gray-100">{result.total_rows}</p>
        </div>
        <div className="bg-success/10 rounded-lg p-4">
          <p className="text-xs text-success/80 mb-1">Processadas</p>
          <p className="text-xl font-bold text-success">{result.processed_rows}</p>
        </div>
        <div className="bg-danger/10 rounded-lg p-4">
          <p className="text-xs text-danger/80 mb-1">Falhas</p>
          <p className="text-xl font-bold text-danger">{result.failed_rows}</p>
        </div>
        <div className="bg-warning/10 rounded-lg p-4">
          <p className="text-xs text-warning/80 mb-1">Taxa de Ataque</p>
          <p className="text-xl font-bold text-warning">
            {(result.attack_rate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2 text-danger">
          <ShieldAlert size={16} /> {result.total_attacks} ataques detectados
        </span>
        <span className="flex items-center gap-2 text-success">
          <ShieldCheck size={16} /> {result.total_normal} tráfego normal
        </span>
        <span className="text-gray-500">
          Processado em {result.processing_time_ms.toFixed(1)}ms
        </span>
      </div>

      {result.errors.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
            <XCircle size={14} className="text-danger" />
            Linhas com erro ({result.errors.length})
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {result.errors.map((err) => (
              <div
                key={err.row_index}
                className="text-xs bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 text-gray-300"
              >
                <span className="text-danger font-medium">Linha {err.row_index}:</span>{" "}
                {err.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.processed_rows > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-success" />
            Amostra de resultados processados
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-border">
                  <th className="py-1.5 px-2 font-medium">Linha</th>
                  <th className="py-1.5 px-2 font-medium">Classe</th>
                  <th className="py-1.5 px-2 font-medium">Prob. Ataque</th>
                  <th className="py-1.5 px-2 font-medium">Risco</th>
                </tr>
              </thead>
              <tbody>
                {result.results.slice(0, 20).map((row) => (
                  <tr key={row.row_index} className="border-b border-border/50">
                    <td className="py-1.5 px-2 text-gray-400">{row.row_index}</td>
                    <td
                      className={`py-1.5 px-2 font-medium ${
                        row.predicted_class === "Ataque" ? "text-danger" : "text-success"
                      }`}
                    >
                      {row.predicted_class}
                    </td>
                    <td className="py-1.5 px-2 text-gray-300">
                      {(row.probability_attack * 100).toFixed(2)}%
                    </td>
                    <td className="py-1.5 px-2 text-gray-400">{row.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.results.length > 20 && (
              <p className="text-xs text-gray-600 text-center mt-2">
                Mostrando 20 de {result.results.length} resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}