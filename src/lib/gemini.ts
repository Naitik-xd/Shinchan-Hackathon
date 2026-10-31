import { GoogleGenAI } from "@google/genai";
import {
  getModelList,
  CallGeminiResult,
  FailureCategory,
  ModelFailureInfo,
} from "./models.js";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[LUMEN SERVER] GEMINI_API_KEY is not set in environment.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Strips code fences (```json ... ```) from model text output
 */
export function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Categorizes errors cleanly without exposing raw server stacks to clients
 */
export function categorizeGeminiError(err: any): FailureCategory {
  if (err instanceof SyntaxError || err?.message?.includes("JSON")) {
    return "invalid_json";
  }
  const msg = (err?.message || String(err)).toLowerCase();
  const status = err?.status || err?.code;
  if (status === 404 || msg.includes("not found") || msg.includes("no longer available")) {
    return "not_found";
  }
  if (
    status === 429 ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit")
  ) {
    return "quota";
  }
  if (
    status === 503 ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("temporarily")
  ) {
    return "unavailable";
  }
  if (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout")
  ) {
    return "network_error";
  }
  return "other";
}


function generateWithTimeout(
  ai: any,
  params: { model: string; contents: string; config: any },
  timeoutMs = 7000
): Promise<any> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Model ${params.model} request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    ai.models.generateContent(params),
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Executes a Gemini request with automatic fallback through configured models.
 * Logs model failures and reasons server-side only.
 */
export async function callGeminiJson<T>(
  prompt: string,
  systemInstruction?: string
): Promise<CallGeminiResult<T>> {
  const ai = getGeminiClient();
  const configuredModels = getModelList();
  const failures: ModelFailureInfo[] = [];

  // Try configured models in exact requested order
  for (let i = 0; i < configuredModels.length; i++) {
    const modelName = configuredModels[i];
    try {
      const response = await generateWithTimeout(
        ai,
        {
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are an expert analytical research assistant. Output strictly valid JSON with no markdown wrapping.",
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        },
        14000
      );

      const text = response.text;
      if (!text) throw new Error("Empty response received from Gemini model.");

      let parsed: T;
      try {
        parsed = JSON.parse(cleanJsonText(text));
      } catch (jsonErr: any) {
        throw new SyntaxError(`Model output was not valid JSON: ${jsonErr.message}`);
      }

      const fallbackNotice =
        failures.length > 0
          ? `Answered using ${modelName} (fallback: ${failures
              .map((f) => `${f.model} [${f.category}]`)
              .join(", ")})`
          : undefined;

      return {
        data: parsed,
        modelUsed: modelName,
        fallbackUsed: i > 0,
        fallbackNotice,
        failureCategories: failures,
      };
    } catch (err: any) {
      const category = categorizeGeminiError(err);
      failures.push({ model: modelName, category });
      console.warn(
        `[LUMEN SERVER] Model "${modelName}" failed [${category}]. Details: ${err?.message || err}`
      );
    }
  }

  // If any model failed due to quota/429
  if (failures.some((f) => f.category === "quota")) {
    throw new Error("model quota reached, please retry shortly");
  }

  throw new Error(
    `All configured Gemini models failed. (${failures
      .map((f) => `${f.model}: ${f.category}`)
      .join(", ")})`
  );
}

/**
 * Executes a Gemini call WITH Google Search Grounding.
 */
export async function callGeminiSearchGrounding(
  prompt: string,
  systemInstruction?: string
): Promise<{
  text: string;
  groundingChunks: any[];
  modelUsed: string;
  fallbackUsed: boolean;
  fallbackNotice?: string;
}> {
  const ai = getGeminiClient();
  const configuredModels = getModelList();
  const failures: ModelFailureInfo[] = [];

  for (let i = 0; i < configuredModels.length; i++) {
    const modelName = configuredModels[i];
    try {
      const response = await generateWithTimeout(
        ai,
        {
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are a fact-checking and public-record research assistant. You have access to Google Search grounding. Provide strictly accurate information and format your response as JSON.",
            tools: [{ googleSearch: {} }],
          },
        },
        14000
      );

      const text = response.text || "";
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const fallbackNotice =
        failures.length > 0
          ? `Search grounded with ${modelName} (fallback: ${failures
              .map((f) => `${f.model} [${f.category}]`)
              .join(", ")})`
          : undefined;

      return {
        text,
        groundingChunks,
        modelUsed: modelName,
        fallbackUsed: i > 0,
        fallbackNotice,
      };
    } catch (err: any) {
      const category = categorizeGeminiError(err);
      failures.push({ model: modelName, category });
      console.warn(
        `[LUMEN SERVER] Search grounding call to "${modelName}" failed with [${category}]: ${err?.message || err}`
      );
    }
  }

  if (failures.some((f) => f.category === "quota")) {
    throw new Error("model quota reached, please retry shortly");
  }

  throw new Error(
    `Grounded search failed across all models (${failures
      .map((f) => `${f.model} [${f.category}]`)
      .join(", ")})`
  );
}

/**
 * Multimodal image text extraction fallback (Gemini Vision)
 */
export async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  prompt?: string
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const configuredModels = getModelList();
  const modelsToTry = configuredModels;

  let cleanBase64 = imageBase64;
  if (cleanBase64.includes(";base64,")) {
    cleanBase64 = cleanBase64.split(";base64,")[1];
  }

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text:
                prompt ||
                "Transcribe all text from this image verbatim. Preserve structure, headings, page markers, tables, and numerical data. Do not summarize or add opinions.",
            },
          ],
        },
      });

      return {
        text: response.text || "",
        modelUsed: modelName,
      };
    } catch (err: any) {
      console.warn(`[LUMEN SERVER] Vision read failed on ${modelName}:`, err?.message || err);
    }
  }

  throw new Error("Vision transcription failed across all candidate models.");
}
