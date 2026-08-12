export interface ConfusionMatrix {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
}

export interface ROCCurveData {
  fpr: number[];
  tpr: number[];
  thresholds: number[];
}

export interface PrecisionRecallCurveData {
  precision: number[];
  recall: number[];
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}