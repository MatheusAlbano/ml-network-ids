import { useEffect, useState } from "react";
import { getSystemStatus } from "./services/statusService";
import type { SystemStatus } from "./types/status";

function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemStatus()
      .then(setStatus)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">
          ML Network IDS
        </h1>

        {loading && <p className="text-gray-400">Conectando à API...</p>}

        {error && (
          <p className="text-danger">
            Falha ao conectar com a API: {error}
          </p>
        )}

        {status && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-success font-medium">
                API {status.status}
              </span>
            </div>
            <p className="text-gray-300">
              Modelo em produção: <strong>{status.model_name}</strong>
            </p>
            <p className="text-gray-400 text-sm">
              F1-score: {(status.model_metrics.test_f1_score * 100).toFixed(2)}%
              {" · "}
              ROC-AUC: {(status.model_metrics.test_roc_auc * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;