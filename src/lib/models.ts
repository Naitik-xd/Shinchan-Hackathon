/**
 * Central model configuration and fallback chain.
 * Default order required:
 *  1. gemini-2.5-flash (primary)
 *  2. gemini-3.8-flash (fallback 1)
 *  3. gemini-2.5-flash-lite (fallback 2)
 *
 * Can be overridden by the GEMINI_MODELS environment variable (comma-separated).
 */

export const DEFAULT_GEMINI_MODELS: string[] = [
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-2.5-flash-lite",
];

export function getModelList(): string[] {
  const envModels = process.env.GEMINI_MODELS;
  if (envModels && envModels.trim()) {
    const list = envModels
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_GEMINI_MODELS;
}

export type FailureCategory =
  | "quota"
  | "not_found"
  | "unavailable"
  | "invalid_json"
  | "network_error"
  | "other";

export interface ModelFailureInfo {
  model: string;
  category: FailureCategory;
}

export interface CallGeminiResult<T> {
  data: T;
  modelUsed: string;
  fallbackUsed: boolean;
  fallbackNotice?: string;
  failureCategories?: ModelFailureInfo[];
}
