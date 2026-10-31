import React, { useState } from "react";
import {
  ShieldAlert,
  Scale,
  Clock,
  Award,
  ListTodo,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Download,
  Share2,
  Calendar,
  Check,
  Search,
} from "lucide-react";
import {
  AnalysisResult,
  Source,
  Gap,
  Conflict,
  Fact,
  ChecklistItem,
  CredibilitySignal,
  OutdatedWarning,
  Coverage,
} from "../types/index.js";

interface ResultsDashboardProps {
  result: AnalysisResult;
  onOpenSourceViewer: (source: Source, snippet?: string) => void;
  onUpdateChecklist: (updatedChecklist: ChecklistItem[]) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  onOpenSourceViewer,
  onUpdateChecklist,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "gaps" | "conflicts" | "facts" | "freshness" | "credibility" | "checklist"
  >("overview");

  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const getSourceById = (id: string): Source | undefined => {
    return result.sources.find((s) => s.id === id);
  };

  // Toggle checklist item completion
  const handleToggleChecklistItem = (id: string) => {
    const updated = result.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateChecklist(updated);
  };

  const completedCount = result.checklist.filter((i) => i.completed).length;
  const checklistProgress =
    result.checklist.length > 0
      ? Math.round((completedCount / result.checklist.length) * 100)
      : 0;

  // Export checklist and summary as Markdown
  const handleExportMarkdown = () => {
    const md = `# Lumen Verification Report: ${result.question}
Date: ${new Date(result.timestamp).toLocaleDateString()}
Confidence: ${result.overallConfidence.level.toUpperCase()} - ${result.overallConfidence.scoreNote}

## Prioritized Verification Checklist
${result.checklist
  .map(
    (item) =>
      `- [${item.completed ? "x" : " "}] **[${item.priority.toUpperCase()}]** ${item.action}\n  *Reason: ${item.reason}*`
  )
  .join("\n\n")}

## Identified Information Gaps
${result.gaps
  .map(
    (gap) =>
      `### [${gap.severity.toUpperCase()}] ${gap.aspect}: ${gap.description}\n- Why it matters: ${gap.whyItMatters}\n- Sources checked: ${gap.checkedSources.join(", ")}`
  )
  .join("\n\n")}

## Contradictions & Conflicts
${result.conflicts
  .map(
    (c) =>
      `### Aspect: ${c.aspect}\n- Explanation: ${c.note}\n${c.claims
        .map((claim) => `  - **${claim.sourceId}**: "${claim.claim}" (Snippet: "${claim.snippet}")`)
        .join("\n")}`
  )
  .join("\n\n")}

---
*Notice: AI-assisted analysis via Lumen. Verify all findings with primary official sources.*
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumen-verification-report-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const textToCopy = `Lumen Verification Checklist for: ${result.question}\n\n` +
      result.checklist
        .map((c) => `[${c.priority.toUpperCase()}] ${c.action} (Reason: ${c.reason})`)
        .join("\n\n");

    navigator.clipboard.writeText(textToCopy);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <section id="results-section" className="w-full space-y-6 pt-4 animate-in fade-in duration-300">
      {/* Top Banner: Status & Quick Metric Strips */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Intelligence Dashboard
            </span>
            <span className="text-xs font-mono text-slate-400">
              {result.sources.length} sources vetted
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {result.question}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Model: {result.modelUsed}</span>
            {result.fallbackUsed && (
              <span className="text-amber-500 font-mono">(fallback model utilized)</span>
            )}
          </p>
        </div>

        {/* Metric counts */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="block text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
              {result.gaps.length}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Dark Spots
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="block text-lg font-mono font-bold text-rose-600 dark:text-rose-400">
              {result.conflicts.length}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Conflicts
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <span className="block text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {result.checklist.length}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Action Items
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#232838]">
        {[
          { id: "overview", label: "Executive Overview", icon: ShieldAlert },
          { id: "gaps", label: `Gaps & Dark Spots (${result.gaps.length})`, icon: AlertTriangle },
          { id: "conflicts", label: `Conflicts (${result.conflicts.length})`, icon: Scale },
          { id: "checklist", label: `Verify Next (${result.checklist.length})`, icon: ListTodo },
          { id: "freshness", label: `Freshness & Dates (${result.outdated.length})`, icon: Clock },
          { id: "facts", label: `Extracted Facts (${result.facts.length})`, icon: FileText },
          { id: "credibility", label: "Source Credibility", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: EXECUTIVE OVERVIEW --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Confidence Gauge & Coverage Meter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Confidence */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase">
                    Overall Source Confidence
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
                      result.overallConfidence.level === "high"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : result.overallConfidence.level === "medium"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {result.overallConfidence.level} Confidence
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {result.overallConfidence.scoreNote}
                </p>
                <div className="space-y-2 mt-4">
                  {result.overallConfidence.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Confidence reflects corroboration, missing essential terms, and date staleness.
              </div>
            </div>

            {/* Evidence Coverage Meter */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase">
                  Evidence Coverage Meter
                </h3>
                <span className="text-xs font-mono text-slate-400">Key Decision Facets</span>
              </div>
              <div className="space-y-3 mt-4">
                {result.coverage.map((cov, i) => {
                  const isCovered = cov.status === "covered";
                  const isPartial = cov.status === "partial";
                  return (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0D12] border border-slate-200 dark:border-[#232838]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                          {cov.aspect}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isCovered
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : isPartial
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {cov.status}
                          </span>
                        </div>
                      </div>
                      {cov.summaryNote && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {cov.summaryNote}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        {cov.sourceIds.map((sid) => (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => {
                              const s = getSourceById(sid);
                              if (s) onOpenSourceViewer(s);
                            }}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {sid}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Checklist Teaser */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Top Priority Verifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Action items needed to clarify the dark spots before signing or applying.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("checklist")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View full checklist ({result.checklist.length}) →
              </button>
            </div>

            <div className="space-y-2.5">
              {result.checklist.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklistItem(item.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                    item.completed
                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                      : "bg-slate-50 dark:bg-[#0B0D12] border-slate-200 dark:border-[#232838] hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      item.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                          item.priority === "high"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className={`text-xs font-semibold ${item.completed ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                        {item.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Disclaimer:</strong> AI-assisted analysis via Google Gemini. Identified dark spots, contradictions, and signals are potential warnings for further review, not legal or financial determinations. Always consult primary official documents before executing contractual agreements.
          </div>
        </div>
      )}

      {/* --- TAB 2: GAPS & DARK SPOTS --- */}
      {activeTab === "gaps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Information that was completely missing, ambiguous, or left unanswered across your sources.
            </p>
            <span className="text-xs font-mono text-slate-400 font-semibold">
              {result.gaps.length} Gaps Found
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {result.gaps.map((gap) => {
              // Check if we have a search enrichment for this gap
              const enrichment = result.enrichments.find((e) => e.gapId === gap.id);

              return (
                <div
                  key={gap.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          gap.severity === "high"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : gap.severity === "medium"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {gap.severity} severity
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Aspect: {gap.aspect}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Checked:</span>
                      {gap.checkedSources.map((sid) => (
                        <button
                          key={sid}
                          type="button"
                          onClick={() => {
                            const s = getSourceById(sid);
                            if (s) onOpenSourceViewer(s);
                          }}
                          className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {sid}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {gap.description}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <strong>Why It Matters:</strong> {gap.whyItMatters}
                    </p>
                  </div>

                  {/* AI-Found Grounded Search Suggestion (Tier 2 Violet) */}
                  {enrichment && (
                    <div className="mt-3 p-3.5 rounded-xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-700 dark:text-purple-400 uppercase">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI-Found via Google Search Grounding (Verify)</span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                          Confidence: {enrichment.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {enrichment.finding}
                      </p>

                      {/* Reference links */}
                      {enrichment.references.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            Grounding Citations:
                          </span>
                          {enrichment.references.map((ref, rIdx) => (
                            <a
                              key={rIdx}
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline bg-purple-500/10 px-2 py-0.5 rounded"
                            >
                              <span>{ref.title || "Public Citation"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: CONFLICTS & CONTRADICTIONS --- */}
      {activeTab === "conflicts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Direct and subtle contradictions between the documents you supplied.
            </p>
            <span className="text-xs font-mono text-rose-500 font-semibold">
              {result.conflicts.length} Contradictions Detected
            </span>
          </div>

          {result.conflicts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No direct contradictions found between the supplied sources.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {conflict.id}
                      </span>
                      <h4 className="text-xs font-bold font-mono uppercase text-slate-500">
                        Aspect: {conflict.aspect}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-amber-500 font-medium">
                      Requires Clarification
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0B0D12] p-3 rounded-xl border border-slate-200 dark:border-[#232838]">
                    <strong>Conflict Note:</strong> {conflict.note}
                  </p>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {conflict.claims.map((claim, cIdx) => {
                      const s = getSourceById(claim.sourceId);
                      return (
                        <div
                          key={cIdx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-[#232838] bg-slate-50 dark:bg-[#0B0D12] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                {claim.sourceId} ({s?.title || "Source"})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (s) onOpenSourceViewer(s, claim.snippet);
                                }}
                                className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                View Context →
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              &quot;{claim.claim}&quot;
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                              Verbatim Snippet:
                            </span>
                            <blockquote className="text-[11px] font-mono italic text-slate-600 dark:text-slate-400 line-clamp-3">
                              &ldquo;{claim.snippet}&rdquo;
                            </blockquote>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: VERIFY NEXT CHECKLIST --- */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Prioritized Action Checklist ({completedCount}/{result.checklist.length} Completed)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Specific questions to email HR, admissions officers, or contract advisors to resolve all dark spots.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMarkdown ? "Copied!" : "Copy Items"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (.md)</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>

          {/* Checklist items list */}
          <div className="space-y-3">
            {result.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklistItem(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  item.completed
                    ? "bg-emerald-500/5 border-emerald-500/25 opacity-70"
                    : "bg-white dark:bg-[#12151D] border-slate-200 dark:border-[#232838] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    item.completed
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  }`}
                >
                  {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        item.priority === "high"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : item.priority === "medium"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.priority} priority
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                  </div>

                  <h4
                    className={`text-sm font-semibold ${
                      item.completed
                        ? "line-through text-slate-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {item.action}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 5: FRESHNESS & TIMELINE --- */}
      {activeTab === "freshness" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm">
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase mb-3">
              Source Chronology Timeline
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Visualizing the temporal gap between your documents to detect expired terms or stale cycle references.
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {result.sources.map((s) => {
                const isOutdated = s.dateStatus === "possibly_outdated";
                const isUndated = s.dateStatus === "undated";

                return (
                  <div key={s.id} className="relative">
                    <span
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-[#12151D] ${
                        isOutdated
                          ? "border-amber-500"
                          : isUndated
                          ? "border-slate-400"
                          : "border-indigo-500"
                      }`}
                    />
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#232838] bg-slate-50 dark:bg-[#0B0D12]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {s.id} · {s.publishedDate || "Undated Document"}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isOutdated
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : isUndated
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {s.dateStatus.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {s.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Kind: {s.kind}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outdated Warnings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm space-y-3">
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase mb-2">
              Staleness Warnings ({result.outdated.length})
            </h3>
            {result.outdated.length === 0 ? (
              <p className="text-xs text-slate-500">No outdated cycle warnings flagged.</p>
            ) : (
              result.outdated.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5"
                >
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-mono font-bold mr-1.5">{w.sourceId}:</span>
                    <span>{w.reason}</span>
                    {w.cycleFound && (
                      <span className="block font-mono text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Cycle found: &quot;{w.cycleFound}&quot;
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 6: EXTRACTED FACTS (TIER 1 GREEN) --- */}
      {activeTab === "facts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Verifiable facts extracted directly from your sources, tagged with Tier 1 evidence badges.
            </p>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {result.facts.length} Verified Facts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {result.facts.map((fact) => {
              const s = getSourceById(fact.sourceId);
              return (
                <div
                  key={fact.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#232838] bg-white dark:bg-[#12151D] hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Sourced · {fact.aspect}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (s) onOpenSourceViewer(s, fact.snippet);
                        }}
                        className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {fact.sourceId} (Click to View)
                      </button>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                      {fact.claim}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      Exact Verbatim Snippet:
                    </span>
                    <blockquote className="text-[11px] font-mono italic text-slate-600 dark:text-slate-400 line-clamp-2">
                      &ldquo;{fact.snippet}&rdquo;
                    </blockquote>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 7: SOURCE CREDIBILITY SIGNALS --- */}
      {activeTab === "credibility" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <strong>Credibility Signal (Estimated):</strong> Lumen never outputs a single arbitrary truth score. Each source is evaluated transparently across domain authority, freshness, peer corroboration, authorship, and public reputation.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.credibilitySignals.map((sig) => {
              const s = getSourceById(sig.sourceId);
              return (
                <div
                  key={sig.sourceId}
                  className="p-5 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {sig.sourceId}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {s?.title || "Document"}
                        </h4>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Kind: {s?.kind}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded ${
                        sig.level === "high"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : sig.level === "medium"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {sig.level} Signal
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {sig.reasons.map((r, rIdx) => (
                      <div
                        key={rIdx}
                        className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                      >
                        <span className="font-mono text-[10px] uppercase font-bold text-slate-400 shrink-0 w-24">
                          {r.factor}:
                        </span>
                        <span className="leading-snug">{r.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
