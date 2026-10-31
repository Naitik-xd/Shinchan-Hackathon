export type Tier = "sourced" | "ai_found" | "uncertain";
export type Severity = "high" | "medium" | "low";
export type SourceKind = "text" | "url" | "pdf" | "image";

export interface Source {
  id: string;               // e.g. "S1", "S2"
  kind: SourceKind;
  title: string;
  url?: string;
  text: string;             // Extracted text
  ocrConfidence?: number;   // 0-100 if OCR was used
  publishedDate?: string;   // ISO or textual date detected
  dateStatus: "found" | "undated" | "possibly_outdated";
  pageCount?: number;
}

export interface Fact {
  id: string;
  aspect: string;           // e.g. eligibility, deadline, compensation, equity, renewal, contact...
  claim: string;
  sourceId: string;
  snippet: string;
  tier: "sourced";
}

export interface Gap {
  id: string;
  aspect: string;
  description: string;
  severity: Severity;
  whyItMatters: string;
  checkedSources: string[]; // Source IDs checked
  tier: "uncertain";
}

export interface ConflictClaim {
  sourceId: string;
  claim: string;
  snippet: string;
}

export interface Conflict {
  id: string;
  aspect: string;
  claims: ConflictClaim[];
  note: string;
  tier: "uncertain";
}

export interface OutdatedWarning {
  sourceId: string;
  reason: string;
  cycleFound?: string;
}

export interface Coverage {
  aspect: string;
  status: "covered" | "partial" | "missing";
  sourceIds: string[];
  summaryNote?: string;
}

export interface CredibilityReason {
  factor: "domain" | "freshness" | "corroboration" | "authorship" | "reputation";
  note: string;
}

export interface CredibilitySignal {
  sourceId: string;
  level: "high" | "medium" | "low" | "unknown";
  reasons: CredibilityReason[];
}

export interface ReferenceLink {
  title: string;
  url: string;
}

export interface Enrichment {
  gapId: string;
  finding: string;
  confidence: "low" | "medium" | "high";
  references: ReferenceLink[];
  tier: "ai_found";
}

export interface ChecklistItem {
  id: string;
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  relatedIds: string[];
  completed?: boolean;
}

export interface OverallConfidence {
  level: "high" | "medium" | "low";
  scoreNote: string;
  reasons: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  question: string;
  sources: Source[];
  facts: Fact[];
  coverage: Coverage[];
  gaps: Gap[];
  conflicts: Conflict[];
  outdated: OutdatedWarning[];
  credibilitySignals: CredibilitySignal[];
  checklist: ChecklistItem[];
  overallConfidence: OverallConfidence;
  enrichments: Enrichment[];
  modelUsed: string;
  fallbackUsed: boolean;
}

export interface SampleScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  question: string;
  sources: {
    title: string;
    kind: SourceKind;
    url?: string;
    text: string;
    publishedDate?: string;
    dateStatus: "found" | "undated" | "possibly_outdated";
  }[];
}
