import { Fact, Source, Conflict, Gap, Coverage, ChecklistItem } from "../types/index.js";

export type TopicType =
  | "scholarship"
  | "hackathon"
  | "job_offer"
  | "admission"
  | "scheme"
  | "product"
  | "other";

export interface TaxonomyAspect {
  key: string;
  label: string;
  description: string;
}

// 1. Scholarship Taxonomy (AICTE Pragati, NSP, fellowship, etc.)
export const SCHOLARSHIP_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Eligibility Criteria", description: "Who can apply, target categories, gender, course/institution type" },
  { key: "income_academic_limits", label: "Income & Academic Limits", description: "Family annual income ceiling, minimum marks or CGPA cutoff" },
  { key: "application_deadline", label: "Application Deadline", description: "Final date for candidate online registration and submission" },
  { key: "verification_deadline", label: "Verification Deadline", description: "Institute nodal officer and state defective application verification cutoff" },
  { key: "documents_required", label: "Documents Required", description: "Income certificate, caste certificate, bonafide, admission receipt, bank proof" },
  { key: "application_process_portal", label: "Application Process & Portal", description: "Official application portal URL, registration steps, workflow" },
  { key: "award_amount_numbers", label: "Award Amount & Number of Awards", description: "Annual stipend amount, contingency grant, total available slots" },
  { key: "selection_process", label: "Selection Process", description: "Merit ranking criteria, quota allocations, tie-breaking rules" },
  { key: "renewal_conditions", label: "Renewal Conditions", description: "Subsequent year eligibility, minimum attendance/marks, promotion without backlogs" },
  { key: "disbursement_method", label: "Disbursement Method", description: "Direct Benefit Transfer (DBT), Aadhaar-seeded bank account requirement" },
  { key: "refund_obligations", label: "Refund & Obligations", description: "Repayment rules if student discontinues studies or holds concurrent scholarship" },
  { key: "official_contact", label: "Official Contact & Support", description: "Official helpdesk email, helpline phone numbers, grievance cell" },
];

// 2. Hackathon Taxonomy
export const HACKATHON_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Eligibility Criteria", description: "Who can participate, student vs professional, location restrictions" },
  { key: "team_size", label: "Team Size & Formation", description: "Individual vs team limits, minimum and maximum team members allowed" },
  { key: "fees", label: "Fees & Payment", description: "Registration fees, hidden costs, or confirmed free entry" },
  { key: "deadlines", label: "Deadlines & Cutoffs", description: "Registration, project submission, and checkpoint deadlines" },
  { key: "theme", label: "Theme & Challenge Tracks", description: "Assigned topic, problem statements, and focus tracks" },
  { key: "format_venue", label: "Format & Venue", description: "Virtual/online, in-person venue, hybrid, mandatory attendance requirements" },
  { key: "submission_requirements", label: "Submission Requirements", description: "Required repo link, video demo, slide deck, and documentation" },
  { key: "judging_criteria", label: "Judging Criteria & Rubric", description: "Scoring weights, evaluation dimensions, and panel composition" },
  { key: "prizes", label: "Prizes & Payout Timeline", description: "Cash amounts, category awards, tax withholdings, and disbursement schedule" },
  { key: "certificates", label: "Certificates & Credentials", description: "Participation certificates, winner plaques, and credential verification" },
  { key: "ip_rules", label: "IP & Code Ownership", description: "Who retains code rights, open-source licenses, and sponsor claims" },
  { key: "contact", label: "Official Contact & Support", description: "Official support email, Discord/Slack channel, and organizer links" },
  { key: "schedule", label: "Schedule & Timeline", description: "Milestone dates, mentoring sessions, and finals schedule" },
];

// 3. Job Offer Taxonomy
export const JOB_OFFER_TAXONOMY: TaxonomyAspect[] = [
  { key: "compensation", label: "Compensation & Base Salary", description: "Base pay, variable bonus, signing bonus, and payout schedule" },
  { key: "benefits", label: "Benefits & Insurance", description: "Health insurance, retirement contribution, PTO, wellness stipends" },
  { key: "equity_vesting", label: "Equity & Vesting Schedule", description: "RSUs/options grant size, strike price, 1-year cliff, and vesting schedule" },
  { key: "notice_period", label: "Notice Period", description: "Required resignation advance notice, garden leave, buy-out clauses" },
  { key: "location_remote_policy", label: "Location & Remote Policy", description: "Designated office, mandatory in-office days per week, hybrid flexibility" },
  { key: "probation", label: "Probation Period", description: "Duration of probation, performance review criteria, termination during probation" },
  { key: "contract_terms", label: "Contract Terms & Restrictive Covenants", description: "Non-compete radius, non-solicitation, IP assignment clauses" },
  { key: "company_legitimacy", label: "Company Legitimacy & Corporate Entity", description: "Registered legal entity name, corporate address, business registration" },
  { key: "contact", label: "Official HR & Recruiter Contact", description: "Corporate recruiter email domain, HR phone number, verification contact" },
];

// 4. Admission Taxonomy
export const ADMISSION_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Eligibility Criteria", description: "Prerequisite degrees, minimum grades/percentages, stream requirements" },
  { key: "entrance_exams", label: "Entrance Exams & Cutoffs", description: "Required exam scores (JEE, CAT, GRE, etc.) and category cutoffs" },
  { key: "fees", label: "Tuition & Seat Fees", description: "Tuition per semester/year, hostel fees, admission deposit, refund policy" },
  { key: "deadlines", label: "Deadlines & Cutoffs", description: "Application close date, counseling rounds, seat acceptance deadline" },
  { key: "documents", label: "Documents Required", description: "Transcripts, transfer certificates, migration, character certificate, ID" },
  { key: "seats", label: "Seats & Reservation Matrix", description: "Total intake capacity, category reservations (SC/ST/OBC/EWS/Management)" },
  { key: "selection", label: "Selection & Merit List", description: "Merit calculation weights, interview rounds, counseling process" },
  { key: "scholarships", label: "Scholarships & Financial Aid", description: "Fee waivers, merit-cum-means assistance, institutional scholarships" },
  { key: "placements", label: "Placements & Career Records", description: "Average package, median CTC, top recruiting companies, placement percentage" },
  { key: "accreditation", label: "Accreditation & Approvals", description: "Statutory approvals (UGC, AICTE, NAAC, NBA) and university affiliation" },
];

// 5. Scheme Taxonomy
export const SCHEME_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Beneficiary Eligibility", description: "Eligible citizen profile, age, income, and geographic scope" },
  { key: "scheme_benefits", label: "Scheme Benefits & Subsidies", description: "Direct financial grant, subsidized equipment, tax concessions" },
  { key: "deadlines", label: "Scheme Deadlines & Validity", description: "Application window, scheme sunset date, disbursement timeline" },
  { key: "application_portal", label: "Application Portal & Steps", description: "Designated government portal, required CSC/online application workflow" },
  { key: "documents_required", label: "Documents Required", description: "Identity card, residence proof, income declaration, bank passbook" },
  { key: "implementing_agency", label: "Implementing Agency & Department", description: "Nodal ministry, state executing department, administrative body" },
  { key: "disbursement_method", label: "Disbursement Method", description: "DBT transfer, milestone inspections, PFMS payment routing" },
  { key: "grievance_contact", label: "Official Helpline & Grievance", description: "Toll-free helpline, grievance officer contact, email support" },
];

// 6. General / Fallback Taxonomy
export const GENERAL_TAXONOMY: TaxonomyAspect[] = [
  { key: "eligibility", label: "Eligibility & Scope", description: "Who or what qualifies, prerequisite conditions, operational scope" },
  { key: "fees", label: "Cost & Financial Terms", description: "Pricing, stated fees, hidden charges, payment obligations" },
  { key: "deadlines", label: "Key Deadlines & Dates", description: "Effective dates, submission cutoffs, expiration timelines" },
  { key: "documents_required", label: "Required Deliverables / Documents", description: "Mandatory forms, paperwork, verification assets, deliverables" },
  { key: "selection", label: "Evaluation & Approval Process", description: "Review steps, criteria, verification milestones" },
  { key: "official_contact", label: "Official Contact & Support", description: "Verified support email, physical address, direct phone contacts" },
  { key: "contract_terms", label: "Terms, Conditions & Penalties", description: "Obligations, cancellation terms, liabilities, exit rules" },
  { key: "format_venue", label: "Format, Location & Modality", description: "Execution environment, jurisdiction, physical or virtual format" },
];

/**
 * Returns the relevant taxonomy for the detected topic.
 * Guarantees NEVER showing irrelevant aspects (e.g. no Equity Vesting for a scholarship).
 */
export function getTaxonomyForTopic(
  topic: TopicType,
  customAspects?: TaxonomyAspect[]
): TaxonomyAspect[] {
  switch (topic) {
    case "scholarship":
      return SCHOLARSHIP_TAXONOMY;
    case "hackathon":
      return HACKATHON_TAXONOMY;
    case "job_offer":
      return JOB_OFFER_TAXONOMY;
    case "admission":
      return ADMISSION_TAXONOMY;
    case "scheme":
      return SCHEME_TAXONOMY;
    case "other":
    default:
      if (Array.isArray(customAspects) && customAspects.length >= 6) {
        return customAspects;
      }
      return GENERAL_TAXONOMY;
  }
}

/**
 * Deterministically classifies topic from user query and sources text.
 */
export function classifyTopicFromText(question: string, sourcesText = ""): TopicType {
  const combined = (question + " " + sourcesText).toLowerCase();

  if (
    combined.includes("scholarship") ||
    combined.includes("fellowship") ||
    combined.includes("stipend") ||
    combined.includes("pragati") ||
    combined.includes("aicte") ||
    combined.includes("nsp") ||
    combined.includes("post-matric") ||
    combined.includes("pre-matric")
  ) {
    return "scholarship";
  }

  if (
    combined.includes("hackathon") ||
    combined.includes("codefest") ||
    combined.includes("datathon") ||
    combined.includes("kaggle") ||
    combined.includes("devpost") ||
    combined.includes("ctf") ||
    combined.includes("challenge track")
  ) {
    return "hackathon";
  }

  if (
    combined.includes("job offer") ||
    combined.includes("offer letter") ||
    combined.includes("employment contract") ||
    combined.includes("salary") ||
    combined.includes("equity") ||
    combined.includes("vesting") ||
    combined.includes("compensation") ||
    combined.includes("non-compete")
  ) {
    return "job_offer";
  }

  if (
    combined.includes("admission") ||
    combined.includes("counseling") ||
    combined.includes("entrance exam") ||
    combined.includes("cutoff") ||
    combined.includes("tuition fee") ||
    combined.includes("university intake") ||
    combined.includes("college admission")
  ) {
    return "admission";
  }

  if (
    combined.includes("scheme") ||
    combined.includes("yojana") ||
    combined.includes("subsidy") ||
    combined.includes("government grant") ||
    combined.includes("citizen grant")
  ) {
    return "scheme";
  }

  return "other";
}

/**
 * Normalizes free-form aspect string into standardized keys.
 */
export function normalizeAspectKey(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  if (s.includes("income") || s.includes("academic limit") || s.includes("cgpa") || s.includes("percentage limit")) return "income_academic_limits";
  if (s.includes("verification deadline") || s.includes("defective") || s.includes("nodal")) return "verification_deadline";
  if (s.includes("application deadline") || s.includes("registration deadline") || s.includes("due date") || s.includes("cutoff") || s.includes("closing date")) return "application_deadline";
  if (s.includes("deadline")) return "deadlines";
  if (s.includes("document") || s.includes("certificate required") || s.includes("proof")) return "documents_required";
  if (s.includes("portal") || s.includes("process") || s.includes("how to apply")) return "application_process_portal";
  if (s.includes("amount") || s.includes("number of award") || s.includes("stipend") || s.includes("slot")) return "award_amount_numbers";
  if (s.includes("renewal") || s.includes("renew") || s.includes("continuation")) return "renewal_conditions";
  if (s.includes("disburse") || s.includes("dbt") || s.includes("bank account") || s.includes("payment method")) return "disbursement_method";
  if (s.includes("refund") || s.includes("obligation") || s.includes("repay")) return "refund_obligations";
  if (s.includes("team") || s.includes("member")) return "team_size";
  if (s.includes("fee") || s.includes("cost") || s.includes("price") || s.includes("tuition")) return "fees";
  if (s.includes("prize") || s.includes("cash") || s.includes("payout")) return "prizes";
  if (s.includes("eligib") || s.includes("qualif") || s.includes("who can apply")) return "eligibility";
  if (s.includes("theme") || s.includes("track") || s.includes("topic")) return "theme";
  if (s.includes("format") || s.includes("venue") || s.includes("location")) return "format_venue";
  if (s.includes("submiss") || s.includes("deliverable")) return "submission_requirements";
  if (s.includes("judg") || s.includes("rubric") || s.includes("criteria")) return "judging_criteria";
  if (s.includes("certificat") || s.includes("credential")) return "certificates";
  if (s.includes("ip ") || s.includes("intellectual") || s.includes("ownership")) return "ip_rules";
  if (s.includes("contact") || s.includes("email") || s.includes("helpline") || s.includes("support")) return "official_contact";
  if (s.includes("compensation") || s.includes("salary") || s.includes("pay")) return "compensation";
  if (s.includes("equity") || s.includes("vesting") || s.includes("stock")) return "equity_vesting";
  if (s.includes("benefit") || s.includes("insurance") || s.includes("pto")) return "benefits";
  if (s.includes("notice period")) return "notice_period";
  if (s.includes("probation")) return "probation";
  if (s.includes("exam") || s.includes("entrance")) return "entrance_exams";
  if (s.includes("seat") || s.includes("reservation")) return "seats";
  if (s.includes("placement")) return "placements";
  if (s.includes("accredit")) return "accreditation";

  return raw.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
}

/**
 * Normalizes values for comparison.
 */
export function normalizeValue(val: string): string {
  return val
    .toLowerCase()
    .replace(/[$,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministically detects contradictions between sources by comparing facts.
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
    const bySource = new Map<string, Fact[]>();
    for (const f of aspectFacts) {
      if (!bySource.has(f.sourceId)) {
        bySource.set(f.sourceId, []);
      }
      bySource.get(f.sourceId)!.push(f);
    }

    if (bySource.size < 2) continue;

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

            if (v1 && v2 && v1 !== v2 && !v1.includes(v2) && !v2.includes(v1)) {
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
                  // Evidence rule: Neutral wording referencing source IDs
                  note: `Direct discrepancy: ${s1} states "${f1.normalizedValue || f1.claim}", whereas ${s2} states "${f2.normalizedValue || f2.claim}".`,
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
 * Builds Coverage Meter deterministically from the topic-aware taxonomy.
 * Uses strict evidence rule: "not found in the sources reviewed".
 */
export function buildDeterministicCoverage(
  facts: Fact[],
  sources: Source[],
  topic: TopicType = "other",
  customAspects?: TaxonomyAspect[]
): Coverage[] {
  const taxonomy = getTaxonomyForTopic(topic, customAspects);

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

  return taxonomy.map((taxon) => {
    const matchingFacts = facts.filter(
      (f) => normalizeAspectKey(f.normalizedAspect || f.aspect) === taxon.key
    );

    const sourceIds = Array.from(new Set(matchingFacts.map((f) => f.sourceId)));
    const hasOfficialCoverage = sourceIds.some((id) => officialSourceIds.has(id));

    let status: "covered" | "partial" | "missing" = "missing";
    // Strict Evidence Rule: Never claim an official portal "has not announced"; use "not found in the sources reviewed"
    let summaryNote = `${taxon.label}: not found in the sources reviewed.`;

    if (matchingFacts.length > 0) {
      if (hasOfficialCoverage) {
        status = "covered";
        summaryNote = `Documented in official source ${sourceIds.join(", ")}.`;
      } else {
        status = "partial";
        summaryNote = `Reported only by unofficial source ${sourceIds.join(", ")}; not found in official sources reviewed.`;
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
 * Generates topic-aware gaps strictly following the Evidence Rule.
 */
export function buildTaxonomyGaps(
  facts: Fact[],
  sources: Source[],
  topic: TopicType = "other",
  existingGaps: Gap[] = [],
  customAspects?: TaxonomyAspect[]
): Gap[] {
  const taxonomy = getTaxonomyForTopic(topic, customAspects);

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

  const allSourceIds = sources.map((s) => s.id);
  const gaps: Gap[] = [...existingGaps];
  let gapIdCounter = gaps.length + 1;

  for (const taxon of taxonomy) {
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
          // Evidence Rule: Strict "not found in the sources reviewed"
          description: `${taxon.label} (${taxon.description}): not found in the sources reviewed.`,
          severity: ["fees", "deadlines", "eligibility", "income_academic_limits", "application_deadline", "compensation", "documents_required"].includes(taxon.key)
            ? "high"
            : "medium",
          whyItMatters: `Crucial decision factor. Prudent applicants must confirm ${taxon.label.toLowerCase()} before relying on this opportunity.`,
          checkedSources: allSourceIds,
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
          // Evidence Rule: Source-trust wording referencing source ID
          description: `Reported by ${unofficialId} (unofficial), but not found in the official sources reviewed.`,
          severity: "medium",
          whyItMatters: `Information from third-party posts may be unverified or outdated. Needs confirmation from official sources.`,
          checkedSources: allSourceIds,
          tier: "uncertain",
          gapType: "single_unofficial_source",
        });
      }
    }
  }

  return gaps;
}

/**
 * Builds checklist referencing source IDs and strictly adhering to evidence rules.
 */
export function buildComprehensiveChecklist(
  gaps: Gap[],
  conflicts: Conflict[],
  existingItems: ChecklistItem[] = []
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let itemCounter = 1;

  // 1. Conflict action items first
  for (const c of conflicts) {
    const claimsBrief = c.claims
      .map((cl) => `${cl.sourceId}: "${cl.normalizedValue || cl.claim}"`)
      .join(" vs ");
    const sourceIds = c.claims.map((cl) => cl.sourceId).join(", ");

    items.push({
      id: `CL${itemCounter++}`,
      priority: "high",
      action: `Resolve contradictory ${c.aspect} between sources ${sourceIds} (${claimsBrief}). Request written clarification.`,
      reason: c.note || `Contradictory values reported between sources ${sourceIds}.`,
      relatedIds: [c.id],
      completed: false,
    });
  }

  // 2. High & medium gaps
  for (const g of gaps) {
    if (g.severity === "high" || g.severity === "medium") {
      const checkedSourcesStr = g.checkedSources.length > 0 ? ` (sources checked: ${g.checkedSources.join(", ")})` : "";
      items.push({
        id: `CL${itemCounter++}`,
        priority: g.severity,
        action: `Confirm ${g.aspect}: not found in the sources reviewed${checkedSourcesStr}. Obtain official guidelines.`,
        reason: g.whyItMatters,
        relatedIds: [g.id],
        completed: false,
      });
    }
  }

  // Custom valid items
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
        reason: existing?.reason || "Verification step.",
        relatedIds: Array.isArray(existing?.relatedIds) ? existing.relatedIds : [],
        completed: Boolean(existing?.completed),
      });
    }
  }

  return items;
}
