import express, { Request, Response } from "express";
import {
  ExtractRequestSchema,
  AnalyzeRequestSchema,
  EnrichRequestSchema,
  VisionReadRequestSchema,
} from "./lib/schemas.js";
import {
  callGeminiJson,
  callGeminiSearchGrounding,
  callGeminiVision,
  cleanJsonText,
  scrubApiKey,
} from "./lib/gemini.js";
import { safeFetchUrl } from "./lib/ssrf.js";
import {
  checkRateLimit,
  MAX_REQUESTS_PER_WINDOW,
  FIVE_HOURS_MS,
} from "./lib/rateLimit.js";
import {
  buildExtractPrompt,
  buildAnalyzePrompt,
  buildEnrichPrompt,
} from "./lib/prompts.js";
import {
  classifyTopicFromText,
  getTaxonomyForTopic,
  detectDeterministicConflicts,
  buildDeterministicCoverage,
  buildTaxonomyGaps,
  buildComprehensiveChecklist,
  normalizeAspectKey,
  TopicType,
} from "./lib/taxonomy.js";
import { getModelList } from "./lib/models.js";
import { Fact, Source, Conflict } from "./types/index.js";

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Helper to extract client IP across standard servers and Vercel serverless edge
  const getClientIp = (req: Request): string => {
    const xRealIp = req.headers["x-real-ip"];
    if (typeof xRealIp === "string" && xRealIp.trim()) {
      return xRealIp.trim();
    }
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "127.0.0.1";
  };

  // Strict Rate Limiting Middleware: strictly 7 requests per 5 hours per IP
  const rateLimitMiddleware = (req: Request, res: Response, next: () => void) => {
    const ip = getClientIp(req);
    const { allowed, remaining, resetInSec, formattedWait } = checkRateLimit(
      ip,
      MAX_REQUESTS_PER_WINDOW,
      FIVE_HOURS_MS
    );

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetInSec.toString());

    if (!allowed) {
      res.setHeader("Retry-After", resetInSec.toString());
      return res.status(429).json({
        error: `Rate limit exceeded: Strictly ${MAX_REQUESTS_PER_WINDOW} requests allowed per 5-hour window to protect Gemini quota and prevent API abuse. Please retry in ${formattedWait}.`,
        limit: MAX_REQUESTS_PER_WINDOW,
        windowHours: 5,
        retryAfterSeconds: resetInSec,
        formattedWait,
      });
    }
    next();
  };

  // --- HEALTH / STATUS ENDPOINT ---
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "operational",
      version: "1.0.0",
      models: getModelList(),
      rateLimit: {
        maxRequests: MAX_REQUESTS_PER_WINDOW,
        windowHours: 5,
      },
      notice: "Application operational. Strict rate limits enforced to protect upstream model quota.",
    });
  });

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

      // 1. Process and fetch sources server-side with strict status checks
      const processedSources: Source[] = [];
      for (let i = 0; i < inputSources.length; i++) {
        const item = inputSources[i];
        const assignedId = `S${i + 1}`;

        if (item.kind === "url" && item.url) {
          try {
            const fetched = await safeFetchUrl(item.url);
            const textContent = (fetched.text || "").trim();
            const charCount = textContent.length;

            if (charCount < 300) {
              const reason =
                charCount === 0
                  ? "Empty page content"
                  : `Content too short (${charCount} characters)`;
              processedSources.push({
                id: assignedId,
                kind: "url",
                title: item.title || fetched.title,
                url: item.url,
                text: textContent,
                publishedDate: fetched.publishedDate,
                dateStatus: fetched.dateStatus,
                status: "failed",
                failureReason: reason,
                charCount,
                statusCode: fetched.statusCode,
              });
            } else {
              processedSources.push({
                id: assignedId,
                kind: "url",
                title: item.title || fetched.title,
                url: item.url,
                text: textContent,
                publishedDate: fetched.publishedDate,
                dateStatus: fetched.dateStatus,
                status: "ok",
                charCount,
                statusCode: fetched.statusCode,
              });
            }
          } catch (fetchErr: any) {
            console.warn(`[LUMEN API] Failed to fetch URL "${item.url}":`, fetchErr.message);
            processedSources.push({
              id: assignedId,
              kind: "url",
              title: item.title || item.url,
              url: item.url,
              text: "",
              dateStatus: "undated",
              status: "failed",
              failureReason: fetchErr.message,
              charCount: 0,
            });
          }
        } else {
          const textContent = (item.text || "").trim();
          const charCount = textContent.length;
          const status = charCount >= 300 ? "ok" : "failed";
          const failureReason =
            charCount < 300
              ? charCount === 0
                ? "Empty text provided"
                : `Content too short (${charCount} characters)`
              : undefined;

          processedSources.push({
            id: assignedId,
            kind: item.kind,
            title: item.title,
            text: textContent,
            ocrConfidence: item.ocrConfidence,
            publishedDate: item.publishedDate,
            dateStatus: item.dateStatus || "undated",
            pageCount: item.pageCount,
            status,
            failureReason,
            charCount,
          });
        }
      }

      // FAIL LOUDLY, NEVER SILENTLY:
      // If fewer than 1 source has usable text (>300 chars), STOP pipeline immediately
      const usableSources = processedSources.filter((s) => s.status === "ok");
      if (usableSources.length < 1) {
        console.warn("[LUMEN API] Stopping pipeline: No sources have usable text (>300 chars).");
        return res.status(400).json({
          error: "We couldn't read these sources. Try pasting the text instead.",
          sources: processedSources,
          facts: [],
        });
      }

      // 2. REDUCE QUOTA USE: Do ONE Gemini call for extraction for ALL usable sources together
      const extractPrompt = buildExtractPrompt(question, usableSources);

      let geminiResult;
      try {
        geminiResult = await callGeminiJson<{
          analyzedSources?: Array<{
            sourceId: string;
            isOfficial?: boolean;
            sourceTypeGuess?: string;
            publishedDate?: string;
            dateStatus?: "found" | "undated" | "possibly_outdated";
            facts?: Array<{
              aspect: string;
              normalizedAspect?: string;
              normalizedValue?: string;
              claim: string;
              snippet: string;
            }>;
          }>;
        }>(extractPrompt);
      } catch (geminiErr: any) {
        if (geminiErr.message?.includes("quota")) {
          return res.status(429).json({
            error: "model quota reached, please retry shortly",
            sources: processedSources,
          });
        }
        throw geminiErr;
      }

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
            const lower = (s.title + " " + (s.url || "")).toLowerCase();
            s.isOfficial =
              lower.includes("official") ||
              lower.includes("portal") ||
              lower.includes(".gov") ||
              lower.includes(".edu") ||
              lower.includes(".org") ||
              lower.includes("handbook");
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

      // FAIL LOUDLY: If Step 1 produces 0 facts, STOP pipeline and return clear error
      if (facts.length === 0) {
        console.warn("[LUMEN API] Stopping pipeline: Step 1 produced 0 verifiable facts.");
        return res.status(400).json({
          error: "We couldn't read these sources. Try pasting the text instead.",
          sources: processedSources,
          facts: [],
        });
      }

      return res.json({
        sources: processedSources,
        facts,
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
        fallbackNotice: geminiResult.fallbackNotice,
      });
    } catch (err: any) {
      const safeMsg = scrubApiKey(err?.message || "");
      console.error("[LUMEN API] /api/extract error:", safeMsg);
      if (err.message?.includes("quota")) {
        return res.status(429).json({
          error: "model quota reached, please retry shortly",
        });
      }
      return res.status(500).json({
        error: "Failed to extract facts from provided sources.",
        message: safeMsg || "Unexpected extraction error.",
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

      // Ensure we never analyze 0 facts
      if (!facts || facts.length === 0) {
        return res.status(400).json({
          error: "We couldn't read these sources. Try pasting the text instead.",
        });
      }

      const sourcesBrief = sources.map((s) => ({
        id: s.id || "S?",
        title: s.title,
        kind: s.kind,
        isOfficial: s.isOfficial,
        sourceTypeGuess: s.sourceTypeGuess,
        publishedDate: s.publishedDate,
        dateStatus: s.dateStatus,
      }));

      // 1. TOPIC-AWARE TAXONOMY CLASSIFICATION
      const combinedSourcesText = sources.map((s) => s.title + " " + (s.text || "")).join(" ");
      const detectedTopic: TopicType = classifyTopicFromText(question, combinedSourcesText);
      const topicAspects = getTaxonomyForTopic(detectedTopic);

      // 2. DETERMINISTIC CONFLICT DETECTION
      const deterministicCandidateConflicts = detectDeterministicConflicts(
        facts as Fact[],
        sourcesBrief as Source[]
      );

      // 3. CALL GEMINI FOR ANALYSIS (Topic-aware, evidence rule enforced)
      const analyzePrompt = buildAnalyzePrompt(
        question,
        sourcesBrief,
        facts,
        deterministicCandidateConflicts,
        detectedTopic,
        topicAspects
      );

      let geminiResult;
      try {
        geminiResult = await callGeminiJson<any>(analyzePrompt);
      } catch (geminiErr: any) {
        if (geminiErr.message?.includes("quota")) {
          return res.status(429).json({
            error: "model quota reached, please retry shortly",
          });
        }
        throw geminiErr;
      }

      const data = geminiResult.data;

      // 4. Merge AI conflicts with deterministic conflicts
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

      // 5. COVERAGE METER: built deterministically from topic-aware taxonomy
      const canonicalCoverage = buildDeterministicCoverage(
        facts as Fact[],
        sourcesBrief as Source[],
        detectedTopic
      );

      // 6. GAP TAXONOMY: standard aspects strictly following evidence rule
      const rawAiGaps = Array.isArray(data.gaps) ? data.gaps : [];
      const comprehensiveGaps = buildTaxonomyGaps(
        facts as Fact[],
        sourcesBrief as Source[],
        detectedTopic,
        rawAiGaps
      );

      // 7. CHECKLIST: one prioritized item per high/medium gap and per conflict
      const rawAiChecklist = Array.isArray(data.checklist) ? data.checklist : [];
      const comprehensiveChecklist = buildComprehensiveChecklist(
        comprehensiveGaps,
        mergedConflicts,
        rawAiChecklist
      );

      const responsePayload = {
        topic: detectedTopic,
        coverage: canonicalCoverage,
        gaps: comprehensiveGaps,
        conflicts: mergedConflicts,
        outdated: Array.isArray(data.outdated) ? data.outdated : [],
        credibilitySignals: Array.isArray(data.credibilitySignals) ? data.credibilitySignals : [],
        checklist: comprehensiveChecklist,
        overallConfidence: data.overallConfidence || {
          level: comprehensiveGaps.some((g) => g.severity === "high") ? "low" : "medium",
          scoreNote: `Topic classified as ${detectedTopic}. Review flagged dark spots before proceeding.`,
          reasons: [
            `${sourcesBrief.length} sources reviewed for ${detectedTopic}`,
            `${comprehensiveGaps.length} information dark spots identified`,
          ],
        },
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
        fallbackNotice: geminiResult.fallbackNotice,
      };

      return res.json(responsePayload);
    } catch (err: any) {
      const safeMsg = scrubApiKey(err?.message || "");
      console.error("[LUMEN API] /api/analyze error:", safeMsg);
      if (err.message?.includes("quota")) {
        return res.status(429).json({
          error: "model quota reached, please retry shortly",
        });
      }
      return res.status(500).json({
        error: "Failed to perform analysis on provided sources.",
        message: safeMsg || "Unexpected analysis error.",
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

      if (!gaps || gaps.length === 0) {
        return res.json({ enrichments: [] });
      }

      const enrichPrompt = buildEnrichPrompt(question, gaps, sources);

      let geminiResult;
      try {
        geminiResult = await callGeminiSearchGrounding(enrichPrompt);
      } catch (geminiErr: any) {
        if (geminiErr.message?.includes("quota")) {
          return res.status(429).json({
            error: "model quota reached, please retry shortly",
          });
        }
        throw geminiErr;
      }

      const rawText = geminiResult.text;
      let enrichments: any[] = [];

      try {
        const parsed = JSON.parse(cleanJsonText(rawText));
        if (Array.isArray(parsed.enrichments)) {
          enrichments = parsed.enrichments.map((en: any) => ({
            ...en,
            tier: "ai_found",
            references: Array.isArray(en.references) ? en.references : [],
          }));
        }
      } catch {
        enrichments = gaps.slice(0, 3).map((g) => ({
          gapId: g.id,
          finding:
            rawText.slice(0, 300) ||
            "No public results found for this gap in official sources reviewed.",
          confidence: "medium",
          references: [],
          tier: "ai_found",
        }));
      }

      // If any gap has no finding, state clearly
      for (const g of gaps) {
        const exists = enrichments.some((e) => e.gapId === g.id);
        if (!exists) {
          enrichments.push({
            gapId: g.id,
            finding: "No public results found for this gap in official sources reviewed.",
            confidence: "low",
            references: [],
            tier: "ai_found",
          });
        }
      }

      return res.json({
        enrichments,
        modelUsed: geminiResult.modelUsed,
        fallbackUsed: geminiResult.fallbackUsed,
        fallbackNotice: geminiResult.fallbackNotice,
      });
    } catch (err: any) {
      const safeMsg = scrubApiKey(err?.message || "");
      console.error("[LUMEN API] /api/enrich error:", safeMsg);
      if (err.message?.includes("quota")) {
        return res.status(429).json({
          error: "model quota reached, please retry shortly",
        });
      }
      return res.status(500).json({
        error: "Failed to enrich gaps with public search.",
        message: safeMsg || "Unexpected enrichment error.",
      });
    }
  });

  // --- POST /api/vision-read ---
  app.post("/api/vision-read", rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedBody = VisionReadRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid vision-read request payload",
          details: parsedBody.error.flatten(),
        });
      }

      const { imageBase64, mimeType, prompt } = parsedBody.data;
      const result = await callGeminiVision(imageBase64, mimeType, prompt);

      return res.json({
        text: result.text,
        modelUsed: result.modelUsed,
      });
    } catch (err: any) {
      const safeMsg = scrubApiKey(err?.message || "");
      console.error("[LUMEN API] /api/vision-read error:", safeMsg);
      return res.status(500).json({
        error: "Failed to read image via Gemini Vision.",
        message: safeMsg || "Unexpected vision processing error.",
      });
    }
  });

  return app;
}

export const apiApp = createApiApp();
