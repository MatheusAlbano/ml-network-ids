import { useState } from "react";
import { Filter, Download } from "lucide-react";
import { getHistoryExportUrl } from "../services/historyService";

interface HistoryFiltersBarProps {
  onApply: (predictedClass: string, riskLevel: string) => void;
}

export function HistoryFiltersBar({ onApply }: HistoryFiltersBarProps) {
  const [predictedClass, setPredictedClass] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-xl p-4 mb-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Classe</label>
        <select
          value={predictedClass}
          onChange={(e) => setPredictedClass(e.target.value)}
          className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todas</option>
          <option value="Normal">Normal</option>
          <option value="Ataque">Ataque</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Nível de Risco</label>
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos</option>
          <option value="Baixo">Baixo</option>
          <option value="Médio">Médio</option>
          <option value="Alto">Alto</option>
          <option value="Crítico">Crítico</option>
        </select>
      </div>

      <button
        onClick={() => onApply(predictedClass, riskLevel)}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Filter size={14} /> Aplicar Filtros
      </button>

      
      <a
      href={getHistoryExportUrl()}
        className="flex items-center gap-2 bg-surface-hover hover:bg-border text-gray-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-auto"
      >
        <Download size={14} /> Exportar CSV
      </a>
    </div>
  );
}