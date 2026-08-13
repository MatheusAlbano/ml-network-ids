import { apiPost } from "./api";
import type { PredictionResult } from "../types/prediction";

export function predictConnection(
  payload: Record<string, string | number>,
  threshold: number = 0.5
): Promise<PredictionResult> {
  return apiPost<PredictionResult>(`/predict?threshold=${threshold}`, payload);
}