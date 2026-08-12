import { useEffect, useState } from "react";
import {
  getConfusionMatrix,
  getROCCurve,
  getPrecisionRecallCurve,
  getFeatureImportance,
} from "../services/statisticsService";
import type {
  ConfusionMatrix,
  ROCCurveData,
  PrecisionRecallCurveData,
  FeatureImportanceItem,
} from "../types/statistics";

interface StatisticsData {
  confusionMatrix: ConfusionMatrix;
  rocCurve: ROCCurveData;
  prCurve: PrecisionRecallCurveData;
  featureImportance: FeatureImportanceItem[];
}

export function useStatistics() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getConfusionMatrix(),
      getROCCurve(),
      getPrecisionRecallCurve(),
      getFeatureImportance(),
    ])
      .then(([confusionMatrix, rocCurve, prCurve, featureImportance]) => {
        setData({ confusionMatrix, rocCurve, prCurve, featureImportance });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}