import { GoogleGenAI } from "@google/genai";
import { getModelList, CallGeminiResult } from "./models.js";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[LUMEN] GEMINI_API_KEY is not set in environment.");
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
 * Executes a Gemini request with automatic fallback through configured models.
 */
export async function callGeminiJson<T>(
  prompt: string,
  systemInstruction?: string
): Promise<CallGeminiResult<T>> {
  const ai = getGeminiClient();
  const models = getModelList();
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    try {
      // Execute call
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an expert analytical research assistant. Output strictly valid JSON with no markdown wrapping.",
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini model.");
      }

      const parsed: T = JSON.parse(cleanJsonText(text));
      return {
        data: parsed,
        modelUsed: modelName,
        fallbackUsed: i > 0,
      };
    } catch (err: any) {
      console.warn(`[LUMEN] Call to model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // continue to next model in fallback list
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || String(lastError)}`);
}

/**
 * Executes a Gemini call WITH Google Search Grounding.
 * Note: Search grounding may not be combinable with strict JSON schema, so we ask for
 * JSON in the prompt, strip markdown fences, parse with try/catch, and extract real
 * groundingChunks from groundingMetadata.
 */
export async function callGeminiSearchGrounding(
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; groundingChunks: any[]; modelUsed: string; fallbackUsed: boolean }> {
  const ai = getGeminiClient();
  const models = getModelList();
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            "You are a fact-checking and public-record research assistant. You have access to Google Search grounding. Provide strictly accurate information and format your response as JSON.",
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return {
        text,
        groundingChunks,
        modelUsed: modelName,
        fallbackUsed: i > 0,
      };
    } catch (err: any) {
      console.warn(`[LUMEN] Grounding call to ${modelName} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`Grounded search failed across all models: ${lastError?.message || String(lastError)}`);
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
  const models = getModelList();
  let lastError: any = null;

  // Clean base64 prefix if present
  let cleanBase64 = imageBase64;
  if (cleanBase64.includes(";base64,")) {
    cleanBase64 = cleanBase64.split(";base64,")[1];
  }

  for (const modelName of models) {
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
      console.warn(`[LUMEN] Vision read failed on ${modelName}:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`Vision transcription failed: ${lastError?.message || String(lastError)}`);
}
