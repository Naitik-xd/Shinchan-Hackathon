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
import {
  detectDeterministicConflicts,
  buildDeterministicCoverage,
  buildTaxonomyGaps,
  buildComprehensiveChecklist,
  normalizeAspectKey,
} from "./src/lib/taxonomy.js";
import { Fact, Source, Conflict, Gap } from "./src/types/index.js";

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
    const { allowed, resetInSec } = checkRateLimit(ip, 45, 60 * 1000);
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
            console.warn(`[LUMEN SERVER] Failed to fetch URL ${item.url}:`, fetchErr.message);
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

      // 2. Build extraction prompt & call Gemini with exhaustive extraction instructions
      const extractPrompt = buildExtractPrompt(question, processedSources);
      const geminiResult = await callGeminiJson<{
        analyzedSources?: Array<{
          sourceId: string;
          isOfficial?: boolean;
          sourceTypeGuess?: string;
          publishedDate?: string;
          dateStatus?: "found" | "undated" | "possibly_outdated";
          cycleReference?: string;
          facts?: Array<{
            aspect: string;
            normalizedAspect?: string;
            normalizedValue?: string;
            claim: string;
            snippet: string;
          }>;
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
          if (typeof aiInfo.isOfficial === "boolean") {
            s.isOfficial = aiInfo.isOfficial;
          } else {
            // Heuristic fallback for official source identification
            const lower = (s.title + " " + (s.url || "")).toLowerCase();
            s.isOfficial =
              lower.includes("official") ||
              lower.includes("portal") ||
              lower.includes(".gov") ||
              lower.includes(".edu") ||
              lower.includes("handbook") ||
              lower.includes("offer letter");
          }
          if (aiInfo.sourceTypeGuess) {
            s.sourceTypeGuess = aiInfo.sourceTypeGuess;
          }

          if (Array.isArray(aiInfo.facts)) {
            for (const f of aiInfo.facts) {
              if (f.claim && f.snippet) {
                const normAspect = normalizeAspectKey(f.normalizedAspect || f.aspect || "general");
                const normVal = f.normalizedValue || f.claim.slice(0, 50);

                facts.push({
                  id: `F${factCounter++}`,
                  aspect: f.aspect || "General Factual Term",
                  normalizedAspect: normAspect,
                  normalizedValue: normVal,
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
        fallbackNotice: geminiResult.fallbackNotice,
      });
    } catch (err: any) {
      console.error("[LUMEN SERVER] /api/extract error:", err);
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
        isOfficial: s.isOfficial,
        sourceTypeGuess: s.sourceTypeGuess,
        publishedDate: s.publishedDate,
        dateStatus: s.dateStatus,
      }));

      // 1. DETERMINISTIC CONFLICT DETECTION IN CODE (Point 3)
      // Group facts by normalized aspect and detect incompatible values between sources
      const deterministicCandidateConflicts = detectDeterministicConflicts(
        facts as Fact[],
        sourcesBrief as Source[]
      );

      // 2. Call Gemini for analysis, passing deterministic candidates to confirm and expand
      const analyzePrompt = buildAnalyzePrompt(
        question,
        sourcesBrief,
        facts,
        deterministicCandidateConflicts
      );
      const geminiResult = await callGeminiJson<any>(analyzePrompt);
      const data = geminiResult.data;

      // 3. Merge AI conflicts with deterministic conflicts (no conflict ever lost)
      const mergedConflicts: Conflict[] = [...deterministicCandidateConflicts];
      const aiConflicts = Array.isArray(data.conflicts) ? data.conflicts : [];

      for (const ac of aiConflicts) {
        const normKey = normalizeAspectKey(ac.normalizedAspect || ac.aspect);
        const alreadyExists = mergedConflicts.some(
          (c) =>
            normalizeAspectKey(c.normalizedAspect || c.aspect) === normKey &&
            c.claims.some((cl) => ac.claims?.some((acl: any) => acl.sourceId === cl.sourceId))
        );

        if (!alreadyExists && Array.isArray(ac.claims) && ac.claims.length >= 2) {
          mergedConflicts.push({
            id: `C${mergedConflicts.length + 1}`,
            aspect: ac.aspect,
            normalizedAspect: normKey,
            claims: ac.claims,
            note: ac.note || "Conflicting claims reported between sources.",
            tier: "uncertain",
          });
        }
      }

      // 4. COVERAGE METER: built deterministically from canonical taxonomy (Point 6)
      const canonicalCoverage = buildDeterministicCoverage(
        facts as Fact[],
        sourcesBrief as Source[]
      );

      // 5. GAP TAXONOMY: standard aspects + single unofficial source flags (Point 4 & 5)
      const rawAiGaps = Array.isArray(data.gaps) ? data.gaps : [];
      const comprehensiveGaps = buildTaxonomyGaps(
        facts as Fact[],
        sourcesBrief as Source[],
        rawAiGaps
      );

      // 6. CHECKLIST: one prioritized item per high/medium gap and per conflict (Point 7)
      const rawAiChecklist = Array.isArray(data.checklist) ? data.checklist : [];
      const comprehensiveChecklist = buildComprehensiveChecklist(
        comprehensiveGaps,
        mergedConflicts,
        rawAiChecklist
      );

      const responsePayload = {
        coverage: canonicalCoverage,
        gaps: comprehensiveGaps,
        conflicts: mergedConflicts,
        outdated: Array.isArray(data.outdated) ? data.outdated : [],
        credibilitySignals: Array.isArray(data.credibilitySignals)
          ? data.credibilitySignals
          : [],
        checklist: comprehensiveChecklist,
        overallConfidence: {
          level: data.overallConfidence?.level || (mergedConflicts.length > 0 || comprehensiveGaps.length >= 4 ? "low" : "medium"),
          scoreNote: data.overallConfidence?.scoreNote || `Identified ${comprehensiveGaps.length} gaps and ${mergedConflicts.length} direct contradictions across ${sourcesBrief.length} sources.`,
          reasons: Array.isArray(data.overallConfidence?.reasons) && data.overallConfidence.reasons.length > 0
            ? data.overallConfidence.reasons
            : [
                `${mergedConflicts.length} direct contradictions require organizer verification.`,
                `${comprehensiveGaps.filter((g) => g.severity === "high").length} high-severity aspects omitted from official documentation.`,
              ],
        },
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
        fallbackNotice: geminiResult.fallbackNotice,
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("[LUMEN SERVER] /api/analyze error:", err);
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
        const { text, groundingChunks, modelUsed, fallbackUsed, fallbackNotice } =
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
          console.warn("[LUMEN SERVER] Grounding JSON parse failed, utilizing fallback structure.");
          parsedData = { enrichments: [] };
        }

        const rawEnrichments = Array.isArray(parsedData.enrichments)
          ? parsedData.enrichments
          : [];

        // Ensure EVERY gap has an explicit enrichment entry (Point 8)
        const finalEnrichments = gaps.map((gap, index) => {
          const match = rawEnrichments.find((e: any) => e.gapId === gap.id);

          if (match && match.finding) {
            const refs =
              Array.isArray(match.references) && match.references.length > 0
                ? match.references
                : verifiedReferences.slice(index * 2, index * 2 + 2);

            return {
              gapId: gap.id,
              finding: match.finding,
              confidence: match.confidence || "medium",
              references: refs,
              tier: "ai_found" as const,
            };
          }

          // If no public information was found, show explicit statement (Point 8)
          return {
            gapId: gap.id,
            finding: "No public results found for this gap via search grounding. Verification with primary organizers/advisors required.",
            confidence: "low" as const,
            references: [],
            tier: "ai_found" as const,
          };
        });

        return res.json({
          enrichments: finalEnrichments,
          reputationNotes: parsedData.reputationNotes || [],
          modelUsed,
          fallbackUsed,
          fallbackNotice,
        });
      } catch (searchErr: any) {
        console.warn("[LUMEN SERVER] Google Search Grounding error, providing default gap notices:", searchErr.message);

        // Ensure all gaps receive the explicit "No public results found" notice (Point 8)
        const fallbackEnrichments = gaps.map((g) => ({
          gapId: g.id,
          finding: "No public results found for this gap via search grounding. Verification with primary organizers/advisors required.",
          confidence: "low" as const,
          references: [],
          tier: "ai_found" as const,
        }));

        return res.json({
          enrichments: fallbackEnrichments,
          reputationNotes: [],
          webEnrichmentUnavailable: true,
          message: "Google Search grounding was unavailable or rate-limited. Results from Steps 1 & 2 remain fully valid.",
        });
      }
    } catch (err: any) {
      console.error("[LUMEN SERVER] /api/enrich error:", err);
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
      console.error("[LUMEN SERVER] /api/vision-read error:", err);
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
  console.error("[LUMEN SERVER] Failed to start server:", err);
  process.exit(1);
});
