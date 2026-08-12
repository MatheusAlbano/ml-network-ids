import { apiGet } from "./api";
import type {
  ConfusionMatrix,
  ROCCurveData,
  PrecisionRecallCurveData,
  FeatureImportanceItem,
} from "../types/statistics";

export function getConfusionMatrix(): Promise<ConfusionMatrix> {
  return apiGet<ConfusionMatrix>("/dashboard/confusion-matrix");
}

export function getROCCurve(): Promise<ROCCurveData> {
  return apiGet<ROCCurveData>("/dashboard/roc-curve");
}

export function getPrecisionRecallCurve(): Promise<PrecisionRecallCurveData> {
  return apiGet<PrecisionRecallCurveData>("/dashboard/precision-recall-curve");
}

export function getFeatureImportance(): Promise<FeatureImportanceItem[]> {
  return apiGet<FeatureImportanceItem[]>("/dashboard/feature-importance");
}