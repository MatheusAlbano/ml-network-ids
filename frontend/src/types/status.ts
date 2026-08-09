export interface ModelMetrics {
  test_accuracy: number;
  test_precision: number;
  test_recall: number;
  test_f1_score: number;
  test_roc_auc: number;
  cv_f1_score_mean: number;
  cv_f1_score_std: number;
}

export interface SystemStatus {
  status: string;
  model_name: string;
  model_metrics: ModelMetrics;
  trained_at: string;
}