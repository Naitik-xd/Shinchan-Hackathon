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
  sourceTypeGuess?: string; // official_organizer, official_website, unofficial_blog, etc.
  isOfficial?: boolean;
}

export interface Fact {
  id: string;
  aspect: string;           // Human readable e.g. "Team Size", "Submission Deadline"
  normalizedAspect: string; // Standardized canonical key e.g. "team_size", "fees", "deadlines"
  normalizedValue: string;  // Normalized concise value e.g. "2-4", "Free ($0)", "March 15, 2026"
  claim: string;
  sourceId: string;
  snippet: string;
  tier: "sourced";
}

export interface Gap {
  id: string;
  aspect: string;
  normalizedAspect?: string;
  description: string;
  severity: Severity;
  whyItMatters: string;
  checkedSources: string[]; // Source IDs checked
  tier: "uncertain";
  gapType?: "uncovered_standard_aspect" | "single_unofficial_source" | "missing_prerequisite" | "unstated_timeline";
}

export interface ConflictClaim {
  sourceId: string;
  claim: string;
  snippet: string;
  normalizedValue?: string;
}

export interface Conflict {
  id: string;
  aspect: string;
  normalizedAspect?: string;
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
  normalizedAspect?: string;
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
  fallbackNotice?: string;
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
