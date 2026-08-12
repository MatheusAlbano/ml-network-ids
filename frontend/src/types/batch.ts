export interface BatchRowResult {
  row_index: number;
  predicted_class: string;
  probability_attack: number;
  risk_level: string;
}

export interface BatchRowError {
  row_index: number;
  error: string;
}

export interface BatchPredictionResponse {
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  total_attacks: number;
  total_normal: number;
  attack_rate: number;
  processing_time_ms: number;
  results: BatchRowResult[];
  errors: BatchRowError[];
}