import { apiGet } from "./api";
import type { DashboardSummary } from "../types/dashboard";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/dashboard/summary");
}