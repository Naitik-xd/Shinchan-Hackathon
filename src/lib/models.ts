/**
 * Central model configuration and fallback chain.
 * Default chain:
 *  1. gemini-2.5-flash (primary)
 *  2. gemini-3.8-flash (fallback 1)
 *  3. gemini-2.5-flash-lite (fallback 2)
 */

export const DEFAULT_GEMINI_MODELS: string[] = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash"
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

export interface CallGeminiResult<T> {
  data: T;
  modelUsed: string;
  fallbackUsed: boolean;
}
