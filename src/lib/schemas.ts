import { z } from "zod";

// Input Schemas
export const SourceInputSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["text", "url", "pdf", "image"]),
  title: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("")),
  text: z.string().max(40000).default(""),
  ocrConfidence: z.number().min(0).max(100).optional(),
  publishedDate: z.string().optional(),
  dateStatus: z.enum(["found", "undated", "possibly_outdated"]).default("undated"),
  pageCount: z.number().optional(),
});

export const ExtractRequestSchema = z.object({
  question: z.string().min(3).max(500),
  sources: z.array(SourceInputSchema).min(1).max(8),
});

// Step 1: Extraction Schema
export const ExtractedFactSchema = z.object({
  aspect: z.string().min(1).max(60),
  claim: z.string().min(2),
  snippet: z.string().min(2),
});

export const ExtractedSourceAnalysisSchema = z.object({
  sourceId: z.string(),
  title: z.string(),
  sourceTypeGuess: z.enum([
    "official_government",
    "education_academic",
    "news_journalism",
    "commercial_vendor",
    "community_forum",
    "unknown"
  ]),
  publishedDate: z.string().nullable().optional(),
  dateStatus: z.enum(["found", "undated", "possibly_outdated"]),
  cycleReference: z.string().nullable().optional(),
  facts: z.array(ExtractedFactSchema),
});

export const ExtractResponseSchema = z.object({
  sources: z.array(z.object({
    id: z.string(),
    kind: z.enum(["text", "url", "pdf", "image"]),
    title: z.string(),
    url: z.string().optional(),
    text: z.string(),
    ocrConfidence: z.number().optional(),
    publishedDate: z.string().optional(),
    dateStatus: z.enum(["found", "undated", "possibly_outdated"]),
    sourceTypeGuess: z.string().optional(),
  })),
  facts: z.array(z.object({
    id: z.string(),
    aspect: z.string(),
    claim: z.string(),
    sourceId: z.string(),
    snippet: z.string(),
    tier: z.literal("sourced"),
  })),
});

// Step 2: Analysis Schemas
export const CoverageItemSchema = z.object({
  aspect: z.string(),
  status: z.enum(["covered", "partial", "missing"]),
  sourceIds: z.array(z.string()),
  summaryNote: z.string().optional(),
});

export const GapItemSchema = z.object({
  id: z.string(),
  aspect: z.string(),
  description: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  whyItMatters: z.string(),
  checkedSources: z.array(z.string()),
  tier: z.literal("uncertain").default("uncertain"),
});

export const ConflictItemSchema = z.object({
  id: z.string(),
  aspect: z.string(),
  claims: z.array(z.object({
    sourceId: z.string(),
    claim: z.string(),
    snippet: z.string(),
  })).min(2),
  note: z.string(),
  tier: z.literal("uncertain").default("uncertain"),
});

export const OutdatedWarningSchema = z.object({
  sourceId: z.string(),
  reason: z.string(),
  cycleFound: z.string().optional(),
});

export const CredibilitySignalSchema = z.object({
  sourceId: z.string(),
  level: z.enum(["high", "medium", "low", "unknown"]),
  reasons: z.array(z.object({
    factor: z.enum(["domain", "freshness", "corroboration", "authorship", "reputation"]),
    note: z.string(),
  })),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  action: z.string(),
  reason: z.string(),
  relatedIds: z.array(z.string()),
  completed: z.boolean().default(false),
});

export const OverallConfidenceSchema = z.object({
  level: z.enum(["high", "medium", "low"]),
  scoreNote: z.string(),
  reasons: z.array(z.string()),
});

export const AnalyzeRequestSchema = z.object({
  question: z.string().min(3).max(500),
  sources: z.array(SourceInputSchema),
  facts: z.array(z.object({
    id: z.string(),
    aspect: z.string(),
    claim: z.string(),
    sourceId: z.string(),
    snippet: z.string(),
    tier: z.literal("sourced"),
  })),
});

export const AnalyzeResponseSchema = z.object({
  coverage: z.array(CoverageItemSchema),
  gaps: z.array(GapItemSchema),
  conflicts: z.array(ConflictItemSchema),
  outdated: z.array(OutdatedWarningSchema),
  credibilitySignals: z.array(CredibilitySignalSchema),
  checklist: z.array(ChecklistItemSchema),
  overallConfidence: OverallConfidenceSchema,
});

// Step 3: Enrichment Schema
export const EnrichRequestSchema = z.object({
  question: z.string().min(3).max(500),
  gaps: z.array(z.object({
    id: z.string(),
    aspect: z.string(),
    description: z.string(),
    severity: z.enum(["high", "medium", "low"]),
  })),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().optional(),
  })),
});

export const ReferenceLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const EnrichmentItemSchema = z.object({
  gapId: z.string(),
  finding: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  references: z.array(ReferenceLinkSchema),
  tier: z.literal("ai_found").default("ai_found"),
});

export const EnrichResponseSchema = z.object({
  enrichments: z.array(EnrichmentItemSchema),
  reputationNotes: z.array(z.object({
    sourceId: z.string(),
    note: z.string(),
    referenceUrls: z.array(z.string()),
  })).optional(),
});

// Vision Read Schema
export const VisionReadRequestSchema = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default("image/jpeg"),
  prompt: z.string().optional(),
});
