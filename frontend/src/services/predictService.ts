import { apiPost } from "./api";
import type { PredictionResult } from "../types/prediction";

export function predictConnection(
  payload: Record<string, string | number>
): Promise<PredictionResult> {
  return apiPost<PredictionResult>("/predict", payload);
}