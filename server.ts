import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import {
  ExtractRequestSchema,
  AnalyzeRequestSchema,
  EnrichRequestSchema,
  VisionReadRequestSchema,
} from "./src/lib/schemas.js";
import {
  callGeminiJson,
  callGeminiSearchGrounding,
  callGeminiVision,
  cleanJsonText,
} from "./src/lib/gemini.js";
import { safeFetchUrl } from "./src/lib/ssrf.js";
import { checkRateLimit } from "./src/lib/rateLimit.js";
import {
  buildExtractPrompt,
  buildAnalyzePrompt,
  buildEnrichPrompt,
} from "./src/lib/prompts.js";
import { Fact, Source } from "./src/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Helper to extract client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "127.0.0.1";
  };

  // Rate limit middleware
  const rateLimitMiddleware = (req: Request, res: Response, next: () => void) => {
    const ip = getClientIp(req);
    const { allowed, resetInSec } = checkRateLimit(ip, 35, 60 * 1000);
    if (!allowed) {
      return res.status(429).json({
        error: `Rate limit exceeded. Please wait ${resetInSec} seconds before submitting again.`,
      });
    }
    next();
  };

  // --- STEP 1: POST /api/extract ---
  app.post("/api/extract", rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedBody = ExtractRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid input payload",
          details: parsedBody.error.flatten(),
        });
      }

      const { question, sources: inputSources } = parsedBody.data;

      // 1. Process sources: fetch URLs server-side with SSRF protection
      const processedSources: Source[] = [];
      for (let i = 0; i < inputSources.length; i++) {
        const item = inputSources[i];
        const assignedId = `S${i + 1}`;

        if (item.kind === "url" && item.url) {
          try {
            const fetched = await safeFetchUrl(item.url);
            processedSources.push({
              id: assignedId,
              kind: "url",
              title: item.title || fetched.title,
              url: item.url,
              text: fetched.text,
              publishedDate: fetched.publishedDate,
              dateStatus: fetched.dateStatus,
            });
          } catch (fetchErr: any) {
            console.warn(`[LUMEN] Failed to fetch URL ${item.url}:`, fetchErr.message);
            processedSources.push({
              id: assignedId,
              kind: "url",
              title: item.title || item.url,
              url: item.url,
              text: `[Error fetching URL: ${fetchErr.message}]`,
              dateStatus: "undated",
            });
          }
        } else {
          processedSources.push({
            id: assignedId,
            kind: item.kind,
            title: item.title,
            text: item.text,
            ocrConfidence: item.ocrConfidence,
            publishedDate: item.publishedDate,
            dateStatus: item.dateStatus || "undated",
            pageCount: item.pageCount,
          });
        }
      }

      // 2. Build extraction prompt & call Gemini
      const extractPrompt = buildExtractPrompt(question, processedSources);
      const geminiResult = await callGeminiJson<{
        analyzedSources?: Array<{
          sourceId: string;
          sourceTypeGuess?: string;
          publishedDate?: string;
          dateStatus?: "found" | "undated" | "possibly_outdated";
          cycleReference?: string;
          facts?: Array<{ aspect: string; claim: string; snippet: string }>;
        }>;
      }>(extractPrompt);

      const analyzedSources = geminiResult.data.analyzedSources || [];
      const facts: Fact[] = [];
      let factCounter = 1;

      // Merge Gemini extracted facts and metadata back into sources
      for (const s of processedSources) {
        const aiInfo = analyzedSources.find((a) => a.sourceId === s.id);
        if (aiInfo) {
          if (aiInfo.publishedDate && !s.publishedDate) {
            s.publishedDate = aiInfo.publishedDate;
          }
          if (aiInfo.dateStatus) {
            s.dateStatus = aiInfo.dateStatus;
          }

          if (Array.isArray(aiInfo.facts)) {
            for (const f of aiInfo.facts) {
              if (f.claim && f.snippet) {
                facts.push({
                  id: `F${factCounter++}`,
                  aspect: f.aspect || "general",
                  claim: f.claim,
                  sourceId: s.id,
                  snippet: f.snippet,
                  tier: "sourced",
                });
              }
            }
          }
        }
      }

      return res.json({
        sources: processedSources,
        facts,
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
      });
    } catch (err: any) {
      console.error("[LUMEN] /api/extract error:", err);
      return res.status(500).json({
        error: "Failed to extract facts from provided sources.",
        message: err.message,
      });
    }
  });

  // --- STEP 2: POST /api/analyze ---
  app.post("/api/analyze", rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedBody = AnalyzeRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid analysis payload",
          details: parsedBody.error.flatten(),
        });
      }

      const { question, sources, facts } = parsedBody.data;

      const sourcesBrief = sources.map((s) => ({
        id: s.id || "S?",
        title: s.title,
        kind: s.kind,
        publishedDate: s.publishedDate,
        dateStatus: s.dateStatus,
      }));

      const analyzePrompt = buildAnalyzePrompt(question, sourcesBrief, facts);
      const geminiResult = await callGeminiJson<any>(analyzePrompt);
      const data = geminiResult.data;

      // Provide safe defaults if fields are missing
      const responsePayload = {
        coverage: Array.isArray(data.coverage) ? data.coverage : [],
        gaps: Array.isArray(data.gaps) ? data.gaps : [],
        conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
        outdated: Array.isArray(data.outdated) ? data.outdated : [],
        credibilitySignals: Array.isArray(data.credibilitySignals)
          ? data.credibilitySignals
          : [],
        checklist: Array.isArray(data.checklist) ? data.checklist : [],
        overallConfidence: data.overallConfidence || {
          level: "medium",
          scoreNote: "Analysis concluded across provided documents.",
          reasons: ["Extracted claims cross-referenced for coherence."],
        },
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("[LUMEN] /api/analyze error:", err);
      return res.status(500).json({
        error: "Failed to cross-compare and analyze source contradictions.",
        message: err.message,
      });
    }
  });

  // --- STEP 3: POST /api/enrich ---
  app.post("/api/enrich", rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedBody = EnrichRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid enrichment payload",
          details: parsedBody.error.flatten(),
        });
      }

      const { question, gaps, sources } = parsedBody.data;

      // If no gaps need enrichment, return empty array immediately
      if (!gaps || gaps.length === 0) {
        return res.json({
          enrichments: [],
          reputationNotes: [],
          modelUsed: "none",
          fallbackUsed: false,
        });
      }

      const enrichPrompt = buildEnrichPrompt(question, gaps, sources);

      try {
        const { text, groundingChunks, modelUsed, fallbackUsed } =
          await callGeminiSearchGrounding(enrichPrompt);

        // Extract real reference links from groundingChunks
        const verifiedReferences: Array<{ title: string; url: string }> = [];
        for (const chunk of groundingChunks) {
          if (chunk.web?.uri) {
            verifiedReferences.push({
              title: chunk.web.title || "Public Web Source",
              url: chunk.web.uri,
            });
          }
        }

        // Parse JSON output leniently
        let parsedData: any = {};
        try {
          parsedData = JSON.parse(cleanJsonText(text));
        } catch (jsonErr) {
          console.warn("[LUMEN] Grounding JSON parse failed, returning fallback summary.");
          parsedData = { enrichments: [] };
        }

        const rawEnrichments = Array.isArray(parsedData.enrichments)
          ? parsedData.enrichments
          : [];

        // Attach verified reference URLs from groundingChunks
        const finalEnrichments = rawEnrichments.map((e: any, index: number) => {
          // If the model did not supply valid references, take from grounding chunks
          const refs =
            Array.isArray(e.references) && e.references.length > 0
              ? e.references
              : verifiedReferences.slice(index * 2, index * 2 + 2);

          return {
            gapId: e.gapId,
            finding: e.finding || "Public web search checked for this gap.",
            confidence: e.confidence || "medium",
            references: refs.length > 0 ? refs : verifiedReferences.slice(0, 2),
            tier: "ai_found" as const,
          };
        });

        return res.json({
          enrichments: finalEnrichments,
          reputationNotes: parsedData.reputationNotes || [],
          modelUsed,
          fallbackUsed,
        });
      } catch (searchErr: any) {
        console.warn("[LUMEN] Google Search Grounding unavailable:", searchErr.message);
        // Resilient fallback: Return clean status without breaking application
        return res.json({
          enrichments: [],
          reputationNotes: [],
          webEnrichmentUnavailable: true,
          message: "Google Search grounding was unavailable. Results from Steps 1 & 2 remain fully valid.",
        });
      }
    } catch (err: any) {
      console.error("[LUMEN] /api/enrich error:", err);
      return res.status(500).json({
        error: "Web enrichment encountered an unexpected error.",
        message: err.message,
      });
    }
  });

  // --- VISION READ FALLBACK: POST /api/vision-read ---
  app.post("/api/vision-read", rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedBody = VisionReadRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid vision-read payload",
          details: parsedBody.error.flatten(),
        });
      }

      const { imageBase64, mimeType, prompt } = parsedBody.data;
      const { text, modelUsed } = await callGeminiVision(imageBase64, mimeType, prompt);

      return res.json({
        text,
        modelUsed,
      });
    } catch (err: any) {
      console.error("[LUMEN] /api/vision-read error:", err);
      return res.status(500).json({
        error: "Failed to transcribe image via Gemini Vision.",
        message: err.message,
      });
    }
  });

  // Vite Integration
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LUMEN] Server running at http://0.0.0.0:${PORT} in ${isProduction ? "production" : "development"} mode.`);
  });
}

startServer().catch((err) => {
  console.error("[LUMEN] Failed to start server:", err);
  process.exit(1);
});
