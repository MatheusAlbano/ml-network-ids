export interface FeatureContribution {
  feature: string;
  value: string | number;
  contribution: number;
  direction: "aumenta" | "diminui";
}

export interface PredictionResult {
  predicted_class: string;
  probability_normal: number;
  probability_attack: number;
  risk_level: "Baixo" | "Médio" | "Alto" | "Crítico";
  inference_time_ms: number;
  model_used: string;
  timestamp: string;
  top_features: FeatureContribution[];
  explanation_text: string;
}