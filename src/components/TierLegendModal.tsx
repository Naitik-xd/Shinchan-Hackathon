import React, { useEffect } from "react";
import { CheckCircle2, Sparkles, AlertTriangle, X, ShieldCheck } from "lucide-react";

interface TierLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TierLegendModal: React.FC<TierLegendModalProps> = ({ isOpen, onClose }) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Modal dialog - stopPropagation so clicking inside does not close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[88vh] bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Sticky Header with prominent, always-visible Close button */}
        <div className="sticky top-0 z-10 px-5 py-3.5 bg-white/95 dark:bg-[#12151D]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Three-Tier Evidence System
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Verification Legend &amp; Standards
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer border border-slate-300/60 dark:border-slate-700"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Lumen enforces strict evidence hygiene. Findings are never blended into vague summaries; every statement is visibly attributed to its verified origin tier.
          </p>

          {/* Tier 1: Sourced */}
          <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase text-[11px]">
                Tier 1 · Sourced Fact (Verified)
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
              Directly extracted from the documents you supplied (text, PDFs, images, URLs). Every claim references a source ID (e.g. S1) and contains an exact verbatim quote.
            </p>
          </div>

          {/* Tier 2: AI-Found */}
          <div className="p-3.5 rounded-xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/20 space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-mono font-bold tracking-wider text-purple-700 dark:text-purple-400 uppercase text-[11px]">
                Tier 2 · AI-Found via Grounded Search (Verify)
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
              Discovered using Google Search grounding to fill identified gaps from public web sources. Always includes reference URLs for independent verification. Never presented as proven fact.
            </p>
          </div>

          {/* Tier 3: Uncertain */}
          <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase text-[11px]">
                Tier 3 · Uncertain / Gap / Contradiction
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
              Unanswered questions, omitted terms, differing claims between sources, and stale cycle warnings. These form the basis of your prioritized verification checklist.
            </p>
          </div>

          {/* Credibility Rubric */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold font-mono tracking-wider text-slate-500 uppercase text-[10px]">
              Transparent Credibility Rubric
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Credibility is never reduced to an arbitrary single number. Lumen scores sources against 5 tangible factors: <strong>Domain authority</strong>, <strong>Freshness</strong>, <strong>Corroboration across sources</strong>, <strong>Authorship transparency</strong>, and <strong>Public reputation signals</strong>.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 leading-normal border border-slate-200/50 dark:border-slate-700/50">
            <strong>Notice:</strong> AI-assisted analysis. Findings are potential gaps and signals, not guaranteed facts. Always verify with official primary sources.
          </div>
        </div>

        {/* Sticky Footer with Close button */}
        <div className="sticky bottom-0 z-10 px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
