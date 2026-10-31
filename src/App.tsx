import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.js";
import { Spotlight3D } from "./components/Spotlight3D.js";
import { SampleCards } from "./components/SampleCards.js";
import { InputPanel } from "./components/InputPanel.js";
import { PipelineProgress, PipelineStage } from "./components/PipelineProgress.js";
import { ResultsDashboard } from "./components/ResultsDashboard.js";
import { SourceViewerDrawer } from "./components/SourceViewerDrawer.js";
import { TierLegendModal } from "./components/TierLegendModal.js";
import { HistoryModal } from "./components/HistoryModal.js";
import { Source, AnalysisResult, ChecklistItem, SampleScenario } from "./types/index.js";
import { SAMPLE_SCENARIOS } from "./lib/samples.js";
import { Sparkles, ShieldAlert, ArrowDown, ExternalLink } from "lucide-react";

export default function App() {
  // Theme state: dark mode default
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lumen_theme");
      if (saved) return saved === "dark";
      return true; // default dark
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("lumen_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("lumen_theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Core Analysis State
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [pipelineError, setPipelineError] = useState<string | undefined>();
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  // Modals & Drawers
  const [isTiersOpen, setIsTiersOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewerSource, setViewerSource] = useState<Source | null>(null);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<AnalysisResult[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("lumen_history");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Select Sample Scenario
  const handleSelectSample = (sample: SampleScenario) => {
    setQuestion(sample.question);
    const mappedSources: Source[] = sample.sources.map((s, idx) => ({
      id: `S${idx + 1}`,
      kind: s.kind,
      title: s.title,
      url: s.url,
      text: s.text,
      publishedDate: s.publishedDate,
      dateStatus: s.dateStatus,
    }));
    setSources(mappedSources);
    showToast(`Loaded "${sample.title}"! Click "Analyze Sources" below to execute.`);
    const el = document.getElementById("input-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Run 3-Stage Pipeline
  const handleStartAnalysis = async () => {
    if (question.trim().length < 3 || sources.length === 0) return;

    setPipelineError(undefined);
    setPipelineStage("extracting");

    try {
      // Step 1: POST /api/extract
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sources }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Step 1 (Fact Extraction) failed.");
      }

      const extractData = await extractRes.json();
      const extractedSources: Source[] = extractData.sources || sources;
      const extractedFacts = extractData.facts || [];

      // Step 2: POST /api/analyze
      setPipelineStage("analyzing");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sources: extractedSources,
          facts: extractedFacts,
        }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Step 2 (Cross-source analysis) failed.");
      }

      const analyzeData = await analyzeRes.json();

      // Preliminary result (rendered before search enrichment)
      const preliminaryResult: AnalysisResult = {
        id: `analysis-${Date.now()}`,
        timestamp: new Date().toISOString(),
        question,
        sources: extractedSources,
        facts: extractedFacts,
        coverage: analyzeData.coverage || [],
        gaps: analyzeData.gaps || [],
        conflicts: analyzeData.conflicts || [],
        outdated: analyzeData.outdated || [],
        credibilitySignals: analyzeData.credibilitySignals || [],
        checklist: analyzeData.checklist || [],
        overallConfidence: analyzeData.overallConfidence || {
          level: "medium",
          scoreNote: "Analysis concluded.",
          reasons: [],
        },
        enrichments: [],
        modelUsed: analyzeData.modelUsed || extractData.modelUsed || "gemini-2.5-flash",
        fallbackUsed: analyzeData.fallbackUsed || extractData.fallbackUsed || false,
        fallbackNotice: analyzeData.fallbackNotice || extractData.fallbackNotice,
      };

      setCurrentResult(preliminaryResult);

      // Step 3: POST /api/enrich (Google Search Grounding)
      setPipelineStage("enriching");
      try {
        const enrichRes = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            gaps: preliminaryResult.gaps.map((g) => ({
              id: g.id,
              aspect: g.aspect,
              description: g.description,
              severity: g.severity,
            })),
            sources: extractedSources.map((s) => ({
              id: s.id,
              title: s.title,
              url: s.url,
            })),
          }),
        });

        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          if (Array.isArray(enrichData.enrichments)) {
            preliminaryResult.enrichments = enrichData.enrichments;
          }
        }
      } catch (enrichErr: any) {
        console.warn("[LUMEN] Step 3 Enrichment failed, proceeding with core findings:", enrichErr);
      }

      setPipelineStage("finalizing");
      setTimeout(() => {
        setPipelineStage("completed");
        setCurrentResult({ ...preliminaryResult });

        // Save to LocalStorage History (max 10)
        try {
          const updatedHistory = [preliminaryResult, ...historyList.filter((h) => h.id !== preliminaryResult.id)].slice(0, 10);
          setHistoryList(updatedHistory);
          localStorage.setItem("lumen_history", JSON.stringify(updatedHistory));
        } catch (storageErr) {
          console.warn("[LUMEN] Could not save history to localStorage:", storageErr);
        }

        // Auto-scroll to results
        const resEl = document.getElementById("results-section");
        if (resEl) resEl.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } catch (err: any) {
      console.error("[LUMEN] Analysis Pipeline Error:", err);
      setPipelineStage("error");
      setPipelineError(err.message || "An unexpected error occurred during analysis.");
    }
  };

  // Update checklist items (checkable)
  const handleUpdateChecklist = (updatedChecklist: ChecklistItem[]) => {
    if (!currentResult) return;
    const updated = { ...currentResult, checklist: updatedChecklist };
    setCurrentResult(updated);

    // Sync in history
    setHistoryList((prev) =>
      prev.map((h) => (h.id === updated.id ? updated : h))
    );
    try {
      localStorage.setItem("lumen_history", JSON.stringify(historyList));
    } catch {}
  };

  // Open Source Viewer with snippet highlighting
  const handleOpenSourceViewer = (source: Source, snippet?: string) => {
    setViewerSource(source);
    setViewerSnippet(snippet);
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0B0D12] text-slate-900 dark:text-[#E8EAF2] transition-colors relative selection:bg-indigo-500/20 selection:text-indigo-400">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60 z-0" />

      {/* Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTiers={() => setIsTiersOpen(true)}
        onScrollToSection={handleScrollToSection}
        hasResults={Boolean(currentResult)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Section with Interactive 3D Spotlight */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 sm:py-10">
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shinchan Hackathon 2026 · Team DEVENGERS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]" style={{ textWrap: "balance" }}>
              Find what is missing{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500">
                before you decide.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Search engines find information. Summarizers shorten it.{" "}
              <strong>Lumen exposes the dark spots:</strong> the hidden omissions, conflicting terms between documents, and outdated clauses across your scholarship, job offer, or admissions papers.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleScrollToSection("input-section")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <span>Start Gap Detection</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample(SAMPLE_SCENARIOS[0])}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#12151D] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-[#232838] rounded-xl transition-all cursor-pointer"
              >
                <span>Load Tech Job Offer Sample</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTiersOpen(true)}
                className="text-xs font-mono text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                View 3-Tier Legend →
              </button>
            </div>
          </div>

          {/* Interactive 3D Optical Spotlight Hero */}
          <div className="lg:col-span-5 h-[280px] sm:h-[320px] rounded-3xl border border-slate-200/80 dark:border-[#232838]/80 bg-white/40 dark:bg-[#12151D]/40 backdrop-blur-md p-2 flex items-center justify-center shadow-lg relative overflow-hidden">
            <Spotlight3D isDarkTheme={isDark} />
          </div>
        </section>

        {/* Sample Scenarios Bar */}
        <SampleCards onSelectSample={handleSelectSample} />

        {/* Multi-Source Ingestion & Processing */}
        <InputPanel
          question={question}
          setQuestion={setQuestion}
          sources={sources}
          setSources={setSources}
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={pipelineStage !== "idle" && pipelineStage !== "completed" && pipelineStage !== "error"}
        />

        {/* Pipeline Execution Stepper */}
        <PipelineProgress stage={pipelineStage} errorMessage={pipelineError} />

        {/* Dashboard Results (When analysis completes) */}
        {currentResult && (
          <ResultsDashboard
            result={currentResult}
            onOpenSourceViewer={handleOpenSourceViewer}
            onUpdateChecklist={handleUpdateChecklist}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-[#232838] py-8 mt-16 bg-white/50 dark:bg-[#0B0D12]/50 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Lumen</span>
            <span>·</span>
            <span>Digital Dark Spot Detector</span>
            <span>·</span>
            <span>Team DEVENGERS (Shinchan Online Hackathon 2026)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Serverless 3-Stage Pipeline</span>
            <span>·</span>
            <span>Gemini 2.5 Flash + Search Grounding</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>

      {/* Click-to-Evidence Source Viewer Drawer */}
      <SourceViewerDrawer
        source={viewerSource}
        highlightSnippet={viewerSnippet}
        onClose={() => setViewerSource(null)}
      />

      {/* Evidence Tiers Modal */}
      <TierLegendModal
        isOpen={isTiersOpen}
        onClose={() => setIsTiersOpen(false)}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        historyList={historyList}
        onSelectHistory={(item) => {
          setCurrentResult(item);
          setQuestion(item.question);
          setSources(item.sources);
          const el = document.getElementById("results-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onClearHistory={() => {
          setHistoryList([]);
          localStorage.removeItem("lumen_history");
        }}
        onDeleteHistoryItem={(id) => {
          const updated = historyList.filter((h) => h.id !== id);
          setHistoryList(updated);
          localStorage.setItem("lumen_history", JSON.stringify(updated));
        }}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
