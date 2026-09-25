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

export async function exportHistory(): Promise<void> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/history/export`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("Não foi possível exportar o histórico.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "historico_analises.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}