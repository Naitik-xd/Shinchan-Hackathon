import React from "react";
import { X, History, Trash2, ArrowRight, Clock } from "lucide-react";
import { AnalysisResult } from "../types/index.js";

interface HistoryModalProps {
  isOpen: boolean;
  historyList: AnalysisResult[];
  onSelectHistory: (item: AnalysisResult) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  historyList,
  onSelectHistory,
  onClearHistory,
  onDeleteHistoryItem,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Local Analysis History ({historyList.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer border border-slate-300/60 dark:border-slate-700"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {historyList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No past analyses stored yet. Analyses are kept locally in your browser.</span>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#232838] bg-slate-50 dark:bg-[#0B0D12] hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span>{item.sources.length} sources</span>
                    <span>·</span>
                    <span className="text-amber-500">{item.gaps.length} gaps</span>
                    <span>·</span>
                    <span className="text-rose-500">{item.conflicts.length} conflicts</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                    {item.question}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectHistory(item);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {historyList.length > 0 && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Saved strictly in browser localStorage.
            </span>
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Clear Entire History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
