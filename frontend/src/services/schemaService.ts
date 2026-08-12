import { apiGet } from "./api";
import type { InputSchema } from "../types/schema";

export function getInputSchema(): Promise<InputSchema> {
  return apiGet<InputSchema>("/schema");
}