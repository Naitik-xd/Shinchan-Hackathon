import React from "react";
import { CheckCircle2, Sparkles, AlertTriangle, X, ShieldCheck } from "lucide-react";

interface TierLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TierLegendModal: React.FC<TierLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Lumen Three-Tier Evidence System
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Lumen enforces strict evidence hygiene. Findings are never blended into vague summaries; every statement is clearly attributed to its verified origin tier.
        </p>

        <div className="space-y-4">
          {/* Tier 1: Sourced */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                Tier 1 · Sourced Fact
              </span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Directly extracted from the documents you supplied (text, PDFs, images, URLs). Every claim references a source ID (e.g., S1) and contains a verifiable verbatim snippet from the document.
            </p>
          </div>

          {/* Tier 2: AI-Found */}
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-purple-700 dark:text-purple-400 uppercase">
                Tier 2 · AI-Found via Grounded Search
              </span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Discovered using Google Search grounding to fill identified gaps from public web sources. Always includes reference URLs for independent verification. Never presented as proven fact.
            </p>
          </div>

          {/* Tier 3: Uncertain */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                Tier 3 · Uncertain / Gap / Contradiction
              </span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Unanswered questions, omitted terms, differing claims between sources, and stale cycle warnings. These form the basis of your prioritized verification checklist.
            </p>
          </div>
        </div>

        {/* Credibility Rubric */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase mb-2">
            Transparent Credibility Rubric
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Credibility is never reduced to an arbitrary single number. Lumen scores sources against 5 tangible factors: <strong>Domain authority</strong>, <strong>Freshness</strong>, <strong>Corroboration across sources</strong>, <strong>Authorship transparency</strong>, and <strong>Public reputation signals</strong>.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-[12px] text-slate-500 dark:text-slate-400">
          <strong>Notice:</strong> AI-assisted analysis. Findings are potential gaps and signals, not guaranteed facts. Always verify final decisions with official primary sources.
        </div>
      </div>
    </div>
  );
};
