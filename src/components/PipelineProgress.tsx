import React from "react";
import { CheckCircle2, Loader2, Search, Scale, ShieldCheck, ListChecks } from "lucide-react";

export type PipelineStage = "idle" | "extracting" | "analyzing" | "enriching" | "finalizing" | "completed" | "error";

interface PipelineProgressProps {
  stage: PipelineStage;
  errorMessage?: string;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ stage, errorMessage }) => {
  if (stage === "idle") return null;

  const steps = [
    {
      id: "extracting",
      title: "Reading Sources & Fact Extraction",
      desc: "Assigning S1..Sn IDs, normalizing dates, and copying verbatim claim snippets.",
      icon: Search,
    },
    {
      id: "analyzing",
      title: "Cross-Comparing Contradictions & Gaps",
      desc: "Detecting missing terms, conflicting claims, and stale cycle warnings.",
      icon: Scale,
    },
    {
      id: "enriching",
      title: "Google Search Grounding & Reputation",
      desc: "Searching public web records to resolve identified high-severity gaps.",
      icon: ShieldCheck,
    },
    {
      id: "finalizing",
      title: "Compiling Verification Checklist",
      desc: "Building a prioritized action plan with clear evidence attribution tiers.",
      icon: ListChecks,
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (stage === "completed") return "done";
    if (stage === "error") return "error";

    const order = ["extracting", "analyzing", "enriching", "finalizing"];
    const currentIndex = order.indexOf(stage);
    const stepIndex = order.indexOf(stepId);

    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm mb-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase flex items-center gap-2">
          {stage !== "completed" && stage !== "error" && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          )}
          <span>Lumen Pipeline Execution</span>
        </h3>
        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
          {stage === "extracting" && "Step 1 of 3"}
          {stage === "analyzing" && "Step 2 of 3"}
          {stage === "enriching" && "Step 3 of 3"}
          {stage === "finalizing" && "Finalizing"}
          {stage === "completed" && "Analysis Complete"}
          {stage === "error" && "Error Encountered"}
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          <strong>Pipeline Warning:</strong> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all ${
                status === "done"
                  ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/10"
                  : status === "active"
                  ? "bg-indigo-500/10 border-indigo-500/40 dark:bg-indigo-950/20 shadow-sm"
                  : "bg-slate-50 dark:bg-[#0B0D12] border-slate-200 dark:border-[#232838] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    status === "done"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : status === "active"
                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : status === "active" ? (
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
