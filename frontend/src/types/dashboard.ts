// Espelha o retorno de GET /dashboard/summary no backend
export interface DashboardSummary {
  total_analyses: number;
  total_attacks: number;
  total_normal: number;
  attack_rate: number;
  last_analysis_at: string | null;
  model_name: string;
  model_accuracy: number;
  model_f1_score: number;
  model_roc_auc: number;
}