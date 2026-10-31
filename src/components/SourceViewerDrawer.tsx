import React, { useEffect, useRef } from "react";
import { X, ExternalLink, Calendar, FileText, Check } from "lucide-react";
import { Source } from "../types/index.js";

interface SourceViewerDrawerProps {
  source: Source | null;
  highlightSnippet?: string;
  onClose: () => void;
}

export const SourceViewerDrawer: React.FC<SourceViewerDrawerProps> = ({
  source,
  highlightSnippet,
  onClose,
}) => {
  const highlightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [source, highlightSnippet]);

  if (!source) return null;

  // Split and highlight snippet in text
  const renderHighlightedContent = (fullText: string, snippet?: string) => {
    if (!snippet || !snippet.trim()) {
      return <span>{fullText}</span>;
    }

    const cleanSnippet = snippet.trim();
    const index = fullText.toLowerCase().indexOf(cleanSnippet.toLowerCase());

    if (index === -1) {
      // Partial fallback or no match
      return <span>{fullText}</span>;
    }

    const before = fullText.substring(0, index);
    const match = fullText.substring(index, index + cleanSnippet.length);
    const after = fullText.substring(index + cleanSnippet.length);

    return (
      <>
        <span>{before}</span>
        <span
          ref={highlightRef}
          className="bg-amber-300 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded font-semibold border-b-2 border-amber-500"
        >
          {match}
        </span>
        <span>{after}</span>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-[#12151D] border-l border-slate-200 dark:border-[#232838] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {source.id}
              </span>
              <span className="text-xs font-mono uppercase text-slate-500">
                {source.kind} document
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {source.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {source.publishedDate || "Undated source"}
              </span>
              {source.ocrConfidence !== undefined && (
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  OCR: {source.ocrConfidence}%
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Alert Banner */}
        {highlightSnippet && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">
              Highlighted verbatim snippet matched from finding.
            </span>
            <span className="font-mono text-[10px] uppercase">Click-To-Evidence</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-300 whitespace-pre-wrap select-text">
          {source.text ? (
            renderHighlightedContent(source.text, highlightSnippet)
          ) : (
            <p className="text-slate-400 italic">No extracted text content available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Remote URL</span>
            </a>
          ) : (
            <span className="text-xs text-slate-400">Local document snapshot</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
