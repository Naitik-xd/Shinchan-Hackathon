import React, { useState } from "react";
import { X, Sparkles, Check, AlertCircle, RefreshCw } from "lucide-react";

interface EditablePreviewModalProps {
  isOpen: boolean;
  sourceTitle: string;
  sourceKind: string;
  initialText: string;
  ocrConfidence?: number;
  imageBase64?: string;
  onSave: (newText: string) => void;
  onClose: () => void;
}

export const EditablePreviewModal: React.FC<EditablePreviewModalProps> = ({
  isOpen,
  sourceTitle,
  sourceKind,
  initialText,
  ocrConfidence,
  imageBase64,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(initialText);
  const [isCallingVision, setIsCallingVision] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLowConfidence = ocrConfidence !== undefined && ocrConfidence < 65;

  const handleGeminiVisionFallback = async () => {
    if (!imageBase64) {
      setVisionError("Original image data not cached for vision fallback.");
      return;
    }

    setIsCallingVision(true);
    setVisionError(null);

    try {
      const res = await fetch("/api/vision-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gemini Vision processing failed.");
      }

      const data = await res.json();
      if (data.text) {
        setText(data.text);
      }
    } catch (err: any) {
      setVisionError(err.message || "Failed to run Gemini Vision fallback.");
    } finally {
      setIsCallingVision(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {sourceKind}
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-md">
                {sourceTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and correct extracted document text before running cross-source analysis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OCR Confidence & Low Confidence Warning Banner */}
        {ocrConfidence !== undefined && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">In-Browser OCR Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ocrConfidence >= 75
                        ? "bg-emerald-500"
                        : ocrConfidence >= 55
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${ocrConfidence}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {ocrConfidence}%
                </span>
              </div>
            </div>

            {/* Automatic Gemini Vision Prompt when confidence is low */}
            {isLowConfidence && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Low confidence detected
                </span>
                <button
                  type="button"
                  onClick={handleGeminiVisionFallback}
                  disabled={isCallingVision}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCallingVision ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading with Vision...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Transcribe with Gemini Vision</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {visionError && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {visionError}
          </div>
        )}

        {/* Text Area */}
        <div className="p-6 flex-1 overflow-y-auto">
          <label className="block text-xs font-mono font-medium text-slate-500 mb-2">
            Editable Document Content ({text.length} characters)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
            placeholder="Document text..."
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Fixing typos or OCR artifacts here ensures accurate gap extraction.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(text);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
