import { useEffect, useState, useCallback } from "react";
import { getHistory } from "../services/historyService";
import type { AnalysisHistoryResponse, HistoryFilters } from "../types/history";

const PAGE_SIZE = 15;

export function useHistory() {
  const [data, setData] = useState<AnalysisHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [predictedClass, setPredictedClass] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [page, setPage] = useState(0);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);

    const filters: HistoryFilters = {
      predicted_class: predictedClass || undefined,
      risk_level: riskLevel || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };

    getHistory(filters)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [predictedClass, riskLevel, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function applyFilters(newClass: string, newRisk: string) {
    setPredictedClass(newClass);
    setRiskLevel(newRisk);
    setPage(0); // volta pra primeira página ao trocar filtro
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    setPage,
    applyFilters,
    refetch: fetchHistory,
  };
}