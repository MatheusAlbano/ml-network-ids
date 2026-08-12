import { apiGet } from "./api";
import type { AnalysisHistoryResponse, HistoryFilters } from "../types/history";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function getHistory(filters: HistoryFilters): Promise<AnalysisHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.predicted_class) params.set("predicted_class", filters.predicted_class);
  if (filters.risk_level) params.set("risk_level", filters.risk_level);
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));

  return apiGet<AnalysisHistoryResponse>(`/history?${params.toString()}`);
}

export function getHistoryExportUrl(): string {
  return `${API_BASE_URL}/history/export`;
}