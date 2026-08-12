import { apiPostFile } from "./api";
import type { BatchPredictionResponse } from "../types/batch";

export function predictBatch(file: File): Promise<BatchPredictionResponse> {
  return apiPostFile<BatchPredictionResponse>("/predict/batch", file);
}