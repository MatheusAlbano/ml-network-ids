export interface AnalysisHistoryItem {
  id: number;
  timestamp: string;
  predicted_class: string;
  probability_attack: number;
  risk_level: "Baixo" | "Médio" | "Alto" | "Crítico";
  inference_time_ms: number;
  model_used: string;
  explanation_text: string;
}

export interface AnalysisHistoryResponse {
  total: number;
  items: AnalysisHistoryItem[];
}

export interface HistoryFilters {
  predicted_class?: string;
  risk_level?: string;
  limit: number;
  offset: number;
}