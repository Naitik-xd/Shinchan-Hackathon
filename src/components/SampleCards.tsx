import React from "react";
import { SAMPLE_SCENARIOS } from "../lib/samples.js";
import { SampleScenario } from "../types/index.js";
import { Briefcase, GraduationCap, Code2, ArrowUpRight, Sparkles } from "lucide-react";

interface SampleCardsProps {
  onSelectSample: (sample: SampleScenario) => void;
}

export const SampleCards: React.FC<SampleCardsProps> = ({ onSelectSample }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "job-offer-verification":
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case "stem-scholarship":
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case "bootcamp-admission":
        return <Code2 className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <section id="samples-section" className="w-full py-8">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase">
            Try a Real Decision Scenario
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pre-loaded multi-source documents containing real conflicts, omissions, and stale terms.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Sample data (fictional)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const isFeatured = scenario.id === "job-offer-verification";
          return (
            <div
              key={scenario.id}
              onClick={() => onSelectSample(scenario)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectSample(scenario);
              }}
              className={`group relative text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isFeatured
                  ? "bg-gradient-to-b from-indigo-500/[0.07] to-transparent dark:from-indigo-500/[0.12] border-indigo-500/40 hover:border-indigo-500/70 shadow-sm hover:shadow-md hover:shadow-indigo-500/10"
                  : "bg-white dark:bg-[#12151D] border-slate-200 dark:border-[#232838] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      {getIcon(scenario.id)}
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400">
                      {scenario.sources.length} sources
                    </span>
                  </div>
                  {isFeatured ? (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Primary Showcase
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      {scenario.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                  <span>{scenario.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Click to fill inputs</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  Load & Review →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
