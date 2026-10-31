import React from "react";
import { Sun, Moon, Sparkles, History as HistoryIcon, HelpCircle } from "lucide-react";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onOpenTiers: () => void;
  onScrollToSection: (id: string) => void;
  hasResults?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  onOpenHistory,
  onOpenTiers,
  onScrollToSection,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors bg-white/80 dark:bg-[#0B0D12]/80 border-slate-200 dark:border-[#232838]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 group-hover:bg-indigo-500 transition-colors">
            <span className="font-mono text-sm font-extrabold">L</span>
          </div>
          <span>Lumen</span>
          <span className="text-xs font-mono font-normal text-indigo-600 dark:text-indigo-400">
            dark spot detector
          </span>
        </a>

        {/* Zone 2: Single-line clean text links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onScrollToSection("input-section")}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Input Sources
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection("samples-section")}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sample Scenarios
          </button>
          {hasResults && (
            <button
              type="button"
              onClick={() => onScrollToSection("results-section")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Intelligence Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTiers}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Evidence Tiers</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Analysis History"
            aria-label="View Analysis History"
          >
            <HistoryIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => onScrollToSection("input-section")}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-lg shadow-sm shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
