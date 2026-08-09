import { apiGet } from "./api";
import type { SystemStatus } from "../types/status";

export function getSystemStatus(): Promise<SystemStatus> {
  return apiGet<SystemStatus>("/status");
}