import { Fact, Source, Conflict, Gap, Coverage, ChecklistItem } from "../types/index.js";

export interface TaxonomyAspect {
  key: string;
  label: string;
  description: string;
  category: "event" | "general" | "employment" | "academic";
}

export const CANONICAL_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Eligibility Criteria", description: "Who can participate/apply, age limits, academic or professional requirements", category: "general" },
  { key: "team_size", label: "Team Size & Formation", description: "Individual vs team participation limits, min/max team members allowed", category: "event" },
  { key: "fees", label: "Fees & Payment", description: "Registration fees, hidden costs, or confirmed free entry", category: "general" },
  { key: "deadlines", label: "Deadlines & Cutoffs", description: "Exact registration, checkpoint, and final submission dates with timezones", category: "general" },
  { key: "theme", label: "Theme & Challenge Tracks", description: "Assigned topic, problem statements, and focus tracks", category: "event" },
  { key: "format_location", label: "Format & Venue", description: "Virtual/online, in-person venue, hybrid, mandatory attendance requirements", category: "general" },
  { key: "submission_requirements", label: "Submission Requirements", description: "Required repo link, video demo, slide deck, and documentation", category: "general" },
  { key: "judging_criteria", label: "Judging Criteria & Rubric", description: "Scoring weights, evaluation dimensions, and panel composition", category: "event" },
  { key: "prizes", label: "Prizes & Payout Timeline", description: "Cash amounts, category awards, tax withholdings, and disbursement schedule", category: "general" },
  { key: "certificates", label: "Certificates & Awards", description: "Participation certificates, winner plaques, and credential verification", category: "event" },
  { key: "ip_ownership", label: "IP & Code Ownership", description: "Who retains code rights, open-source licenses, and sponsor claims", category: "general" },
  { key: "allowed_tools", label: "Allowed Tools & Tech Stack", description: "Permitted AI tools, prohibited pre-built code, and library restrictions", category: "general" },
  { key: "code_of_conduct", label: "Code of Conduct & Ethics", description: "Anti-harassment rules, academic honesty, and plagiarism policies", category: "general" },
  { key: "contact", label: "Official Contact & Support", description: "Official support email, Discord/Slack channel, and organizer links", category: "general" },
  { key: "schedule_dates", label: "Schedule & Timeline", description: "Key milestone dates, mentoring sessions, and finals schedule", category: "event" },
  { key: "perks", label: "Perks & Resources", description: "API keys provided, cloud compute credits, mentoring, and swag kits", category: "event" },
  // Domain additions
  { key: "compensation", label: "Compensation & Benefits", description: "Salary, stipends, bonuses, and healthcare coverage", category: "employment" },
  { key: "equity_vesting", label: "Equity Vesting Schedule", description: "Grant size, 1-year cliff, and vesting duration", category: "employment" },
  { key: "renewal_requirements", label: "Renewal & Maintenance Terms", description: "Minimum GPA, continuing progress milestones, and renewal funding rules", category: "academic" },
];

/**
 * Normalizes any free-form aspect string into our canonical taxonomy keys
 */
export function normalizeAspectKey(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  if (s.includes("team") || s.includes("member") || s.includes("group size")) return "team_size";
  if (s.includes("fee") || s.includes("cost") || s.includes("price") || s.includes("tuition") || s.includes("charge")) return "fees";
  if (s.includes("deadline") || s.includes("due date") || s.includes("cutoff") || s.includes("closing date")) return "deadlines";
  if (s.includes("prize") || s.includes("award") || s.includes("reward") || s.includes("bounty") || s.includes("cash") || s.includes("payout")) return "prizes";
  if (s.includes("eligib") || s.includes("qualif") || s.includes("who can apply") || s.includes("pre req") || s.includes("prereq")) return "eligibility";
  if (s.includes("theme") || s.includes("track") || s.includes("topic") || s.includes("challenge") || s.includes("prompt")) return "theme";
  if (s.includes("format") || s.includes("location") || s.includes("venue") || s.includes("online") || s.includes("virtual") || s.includes("hybrid") || s.includes("in person")) return "format_location";
  if (s.includes("submiss") || s.includes("deliverable") || s.includes("what to submit") || s.includes("document required")) return "submission_requirements";
  if (s.includes("judg") || s.includes("evaluat") || s.includes("rubric") || s.includes("scoring") || s.includes("criteria")) return "judging_criteria";
  if (s.includes("certificat") || s.includes("credential") || s.includes("diploma")) return "certificates";
  if (s.includes("ip ") || s.includes("intellectual") || s.includes("ownership") || s.includes("copyright") || s.includes("license")) return "ip_ownership";
  if (s.includes("tool") || s.includes("tech stack") || s.includes("allowed") || s.includes("prohibited")) return "allowed_tools";
  if (s.includes("conduct") || s.includes("ethics") || s.includes("plagiarism") || s.includes("harassment") || s.includes("rules")) return "code_of_conduct";
  if (s.includes("contact") || s.includes("email") || s.includes("discord") || s.includes("slack") || s.includes("organizer") || s.includes("support")) return "contact";
  if (s.includes("schedule") || s.includes("finals") || s.includes("timeline") || s.includes("agenda") || s.includes("date")) return "schedule_dates";
  if (s.includes("perk") || s.includes("swag") || s.includes("credit") || s.includes("stipend") || s.includes("kit")) return "perks";
  if (s.includes("compensation") || s.includes("salary") || s.includes("wage") || s.includes("pay")) return "compensation";
  if (s.includes("equity") || s.includes("rsu") || s.includes("stock") || s.includes("vesting") || s.includes("cliff")) return "equity_vesting";
  if (s.includes("renew") || s.includes("continuation") || s.includes("gpa")) return "renewal_requirements";

  return raw.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
}

/**
 * Normalizes numerical and categorical values for reliable cross-comparison
 */
export function normalizeValue(val: string): string {
  return val
    .toLowerCase()
    .replace(/[$,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministically detects contradictions by grouping facts by normalized aspect
 * and checking for distinct, incompatible values between sources.
 */
export function detectDeterministicConflicts(facts: Fact[], sources: Source[]): Conflict[] {
  const grouped = new Map<string, Fact[]>();

  for (const fact of facts) {
    const key = normalizeAspectKey(fact.normalizedAspect || fact.aspect);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(fact);
  }

  const conflicts: Conflict[] = [];
  let conflictIdCounter = 1;

  for (const [aspectKey, aspectFacts] of grouped.entries()) {
    // Collect facts per unique source
    const bySource = new Map<string, Fact[]>();
    for (const f of aspectFacts) {
      if (!bySource.has(f.sourceId)) {
        bySource.set(f.sourceId, []);
      }
      bySource.get(f.sourceId)!.push(f);
    }

    if (bySource.size < 2) continue;

    // Compare claims between pairs of sources
    const sourceIds = Array.from(bySource.keys());
    for (let i = 0; i < sourceIds.length; i++) {
      for (let j = i + 1; j < sourceIds.length; j++) {
        const s1 = sourceIds[i];
        const s2 = sourceIds[j];
        const facts1 = bySource.get(s1)!;
        const facts2 = bySource.get(s2)!;

        for (const f1 of facts1) {
          for (const f2 of facts2) {
            const v1 = normalizeValue(f1.normalizedValue || f1.claim);
            const v2 = normalizeValue(f2.normalizedValue || f2.claim);

            // If normalized values are substantially different and not substrings of each other
            if (v1 && v2 && v1 !== v2 && !v1.includes(v2) && !v2.includes(v1)) {
              // Avoid duplicate conflicts for same pair & aspect
              const alreadyExists = conflicts.some(
                (c) =>
                  c.normalizedAspect === aspectKey &&
                  c.claims.some((cl) => cl.sourceId === s1) &&
                  c.claims.some((cl) => cl.sourceId === s2)
              );

              if (!alreadyExists) {
                conflicts.push({
                  id: `C${conflictIdCounter++}`,
                  aspect: f1.aspect || aspectKey,
                  normalizedAspect: aspectKey,
                  claims: [
                    {
                      sourceId: s1,
                      claim: f1.claim,
                      snippet: f1.snippet,
                      normalizedValue: f1.normalizedValue,
                    },
                    {
                      sourceId: s2,
                      claim: f2.claim,
                      snippet: f2.snippet,
                      normalizedValue: f2.normalizedValue,
                    },
                  ],
                  note: `Direct contradiction: ${s1} states "${f1.normalizedValue || f1.claim}" whereas ${s2} states "${f2.normalizedValue || f2.claim}". Clarification required from official organizers.`,
                  tier: "uncertain",
                });
              }
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Builds the canonical Coverage Meter deterministically from the taxonomy
 */
export function buildDeterministicCoverage(facts: Fact[], sources: Source[]): Coverage[] {
  const officialSourceIds = new Set(
    sources
      .filter(
        (s) =>
          s.isOfficial ||
          s.sourceTypeGuess === "official_organizer" ||
          s.sourceTypeGuess === "official_website" ||
          s.sourceTypeGuess === "official_government"
      )
      .map((s) => s.id)
  );

  return CANONICAL_TAXONOMY.map((taxon) => {
    const matchingFacts = facts.filter(
      (f) => normalizeAspectKey(f.normalizedAspect || f.aspect) === taxon.key
    );

    const sourceIds = Array.from(new Set(matchingFacts.map((f) => f.sourceId)));
    const hasOfficialCoverage = sourceIds.some((id) => officialSourceIds.has(id));

    let status: "covered" | "partial" | "missing" = "missing";
    let summaryNote = `No information found for ${taxon.label.toLowerCase()} across any supplied sources.`;

    if (matchingFacts.length > 0) {
      if (hasOfficialCoverage && matchingFacts.length >= 2) {
        status = "covered";
        summaryNote = `Documented by official source ${sourceIds.join(", ")}.`;
      } else if (hasOfficialCoverage) {
        status = "covered";
        summaryNote = `Documented by official source (${sourceIds.join(", ")}).`;
      } else {
        status = "partial";
        summaryNote = `Mentioned only in unofficial source (${sourceIds.join(", ")}); unverified by official documentation.`;
      }
    }

    return {
      aspect: taxon.label,
      normalizedAspect: taxon.key,
      status,
      sourceIds,
      summaryNote,
    };
  });
}

/**
 * Generates deterministic gaps from the taxonomy and single-unofficial-source rules
 */
export function buildTaxonomyGaps(
  facts: Fact[],
  sources: Source[],
  existingGaps: Gap[] = []
): Gap[] {
  const officialSourceIds = new Set(
    sources
      .filter(
        (s) =>
          s.isOfficial ||
          s.sourceTypeGuess === "official_organizer" ||
          s.sourceTypeGuess === "official_website" ||
          s.sourceTypeGuess === "official_government"
      )
      .map((s) => s.id)
  );

  const gaps: Gap[] = [...existingGaps];
  let gapIdCounter = gaps.length + 1;

  for (const taxon of CANONICAL_TAXONOMY) {
    const matchingFacts = facts.filter(
      (f) => normalizeAspectKey(f.normalizedAspect || f.aspect) === taxon.key
    );
    const sourceIds = Array.from(new Set(matchingFacts.map((f) => f.sourceId)));
    const hasOfficialCoverage = sourceIds.some((id) => officialSourceIds.has(id));

    // Rule 1: Aspect not covered by any source
    if (matchingFacts.length === 0) {
      const alreadyHasGap = gaps.some(
        (g) => normalizeAspectKey(g.normalizedAspect || g.aspect) === taxon.key
      );
      if (!alreadyHasGap) {
        gaps.push({
          id: `G${gapIdCounter++}`,
          aspect: taxon.label,
          normalizedAspect: taxon.key,
          description: `No information provided regarding ${taxon.label.toLowerCase()} (${taxon.description}).`,
          severity: ["fees", "deadlines", "eligibility", "team_size", "submission_requirements"].includes(taxon.key)
            ? "high"
            : "medium",
          whyItMatters: `Crucial decision factor. Prudent participants must confirm ${taxon.label.toLowerCase()} before investing preparation time.`,
          checkedSources: sources.map((s) => s.id),
          tier: "uncertain",
          gapType: "uncovered_standard_aspect",
        });
      }
    }
    // Rule 2: Appears only in a single unofficial source
    else if (!hasOfficialCoverage && sourceIds.length === 1) {
      const alreadyHasGap = gaps.some(
        (g) =>
          normalizeAspectKey(g.normalizedAspect || g.aspect) === taxon.key &&
          g.gapType === "single_unofficial_source"
      );
      if (!alreadyHasGap) {
        const unofficialId = sourceIds[0];
        gaps.push({
          id: `G${gapIdCounter++}`,
          aspect: taxon.label,
          normalizedAspect: taxon.key,
          description: `Reported only by unofficial source ${unofficialId}, not confirmed by official documentation.`,
          severity: "medium",
          whyItMatters: `Information from unofficial third-party blogs or social posts may be speculative or outdated. Must be verified with official channels.`,
          checkedSources: sources.map((s) => s.id),
          tier: "uncertain",
          gapType: "single_unofficial_source",
        });
      }
    }
  }

  return gaps;
}

/**
 * Generates one prioritized checklist action item per high/medium gap and per conflict.
 * Every conflict item explicitly names the conflicting values and source IDs!
 */
export function buildComprehensiveChecklist(
  gaps: Gap[],
  conflicts: Conflict[],
  existingItems: ChecklistItem[] = []
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let itemCounter = 1;

  // 1. Generate an item for each conflict first (highest priority!)
  for (const c of conflicts) {
    const claimsBrief = c.claims
      .map((cl) => `${cl.sourceId}: "${cl.normalizedValue || cl.claim}"`)
      .join(" vs ");

    items.push({
      id: `CL${itemCounter++}`,
      priority: "high",
      action: `Resolve contradictory ${c.aspect}: ${claimsBrief}. Request written clarification from official organizers.`,
      reason: c.note || `Incompatible terms found between sources ${c.claims.map((cl) => cl.sourceId).join(" and ")}.`,
      relatedIds: [c.id],
      completed: false,
    });
  }

  // 2. Generate an item for each high & medium severity gap
  for (const g of gaps) {
    if (g.severity === "high" || g.severity === "medium") {
      items.push({
        id: `CL${itemCounter++}`,
        priority: g.severity,
        action: `Confirm ${g.aspect}: ${g.description.replace(/^No information provided regarding /i, "Verify ")}`,
        reason: g.whyItMatters,
        relatedIds: [g.id],
        completed: false,
      });
    }
  }

  // If there are existing unique custom items, append valid ones
  for (const existing of existingItems) {
    const act = (
      existing?.action ||
      (existing as any)?.task ||
      (existing as any)?.title ||
      ""
    ).trim();

    if (
      act.length > 0 &&
      act.toLowerCase() !== "undefined" &&
      !items.some((it) => it.action.toLowerCase() === act.toLowerCase())
    ) {
      items.push({
        id: `CL${itemCounter++}`,
        priority: existing?.priority || "medium",
        action: act,
        reason: existing?.reason || "Recommended verification step.",
        relatedIds: Array.isArray(existing?.relatedIds) ? existing.relatedIds : [],
        completed: Boolean(existing?.completed),
      });
    }
  }

  return items;
}
