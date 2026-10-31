import React, { useState } from "react";
import {
  FileText,
  Globe,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  AlertCircle,
  FileCheck,
  Loader2,
} from "lucide-react";
import { Source } from "../types/index.js";
import { extractTextFromPdf, extractTextFromImage, ParseProgress } from "../lib/fileParser.js";
import { EditablePreviewModal } from "./EditablePreviewModal.js";

interface InputPanelProps {
  question: string;
  setQuestion: (q: string) => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  question,
  setQuestion,
  sources,
  setSources,
  onStartAnalysis,
  isAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "url" | "file">("text");

  // Tab 1: Paste Text state
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  // Tab 2: URL state
  const [urlTitle, setUrlTitle] = useState("");
  const [urlAddress, setUrlAddress] = useState("");

  // Tab 3: File state
  const [fileProgress, setFileProgress] = useState<ParseProgress | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Edit preview state
  const [editingSource, setEditingSource] = useState<{
    source: Source;
    index: number;
    imageBase64?: string;
  } | null>(null);

  // Temporary image cache for Gemini vision fallback
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});

  // Add Pasted Text
  const handleAddTextSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    const newSource: Source = {
      id: `S${sources.length + 1}`,
      kind: "text",
      title: textTitle.trim() || `Pasted Source ${sources.length + 1}`,
      text: textContent.trim(),
      dateStatus: "undated",
    };

    setSources((prev) => [...prev, newSource]);
    setTextTitle("");
    setTextContent("");
  };

  // Add Web URL
  const handleAddUrlSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlAddress.trim()) return;

    let formattedUrl = urlAddress.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      alert("Please enter a valid URL.");
      return;
    }

    const newSource: Source = {
      id: `S${sources.length + 1}`,
      kind: "url",
      title: urlTitle.trim() || new URL(formattedUrl).hostname,
      url: formattedUrl,
      text: "",
      dateStatus: "undated",
    };

    setSources((prev) => [...prev, newSource]);
    setUrlTitle("");
    setUrlAddress("");
  };

  // Upload File (PDF or Image)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileError(null);

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File exceeds maximum allowed size of 10MB.");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      setFileError("Unsupported file type. Please upload a PDF, PNG, JPG, or WebP document.");
      return;
    }

    try {
      if (isPdf) {
        const { text, pageCount, isOcrUsed, ocrConfidence } = await extractTextFromPdf(
          file,
          (prog) => setFileProgress(prog)
        );

        const newSource: Source = {
          id: `S${sources.length + 1}`,
          kind: "pdf",
          title: file.name.replace(/\.[^/.]+$/, ""),
          text: text,
          dateStatus: "undated",
          ocrConfidence: isOcrUsed ? ocrConfidence : undefined,
          pageCount,
        };

        setSources((prev) => [...prev, newSource]);
        setFileProgress(null);
      } else if (isImage) {
        const { text, ocrConfidence, imageBase64 } = await extractTextFromImage(
          file,
          (prog) => setFileProgress(prog)
        );

        const sourceId = `S${sources.length + 1}`;
        const newSource: Source = {
          id: sourceId,
          kind: "image",
          title: file.name.replace(/\.[^/.]+$/, ""),
          text,
          ocrConfidence,
          dateStatus: "undated",
        };

        setCachedImages((prev) => ({ ...prev, [sourceId]: imageBase64 }));
        setSources((prev) => [...prev, newSource]);
        setFileProgress(null);
      }
    } catch (err: any) {
      console.error("[LUMEN] File extraction failed:", err);
      setFileError(`Failed to extract text: ${err.message}`);
      setFileProgress(null);
    }
  };

  const removeSource = (id: string) => {
    setSources((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Re-index IDs S1, S2...
      return filtered.map((s, idx) => ({ ...s, id: `S${idx + 1}` }));
    });
  };

  const handleUpdateSourceText = (newText: string) => {
    if (!editingSource) return;
    setSources((prev) =>
      prev.map((s) => (s.id === editingSource.source.id ? { ...s, text: newText } : s))
    );
  };

  const isReadyToAnalyze = question.trim().length >= 3 && sources.length >= 1;

  return (
    <section id="input-section" className="w-full space-y-6">
      {/* 1. Decision Goal / Question Input */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="decision-question" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            <span>Your Decision Goal or Research Question</span>
          </label>
          <span className="text-xs font-mono text-slate-400">
            {question.length}/500 chars
          </span>
        </div>
        <textarea
          id="decision-question"
          rows={3}
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Should I accept this Senior Staff Engineer offer at NovaScale Systems? What critical terms or risks need immediate verification before signing?"
          className="w-full p-3.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
        />
        <p className="text-[12px] text-slate-500 mt-2">
          Lumen cross-references all sources against this specific goal to detect missing prerequisites, conflicting claims, and staleness.
        </p>
      </div>

      {/* 2. Add Sources Ingestion Area */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-[#232838] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-500 uppercase">
              Add Evidence Sources ({sources.length}/8)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add offer letters, handbook PDFs, program websites, recruiter emails, or scanned posters.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "text"
                  ? "bg-white dark:bg-[#12151D] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "url"
                  ? "bg-white dark:bg-[#12151D] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "file"
                  ? "bg-white dark:bg-[#12151D] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-purple-500" />
              <span>Upload PDF/Image</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Paste Text */}
        {activeTab === "text" && (
          <form onSubmit={handleAddTextSource} className="space-y-3">
            <input
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Source Title (e.g. Recruiter Email Thread)"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <textarea
              rows={4}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste email text, contract clause, syllabus, or agreement body here..."
              className="w-full p-3.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!textContent.trim() || sources.length >= 8}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source Card</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Add Web URL */}
        {activeTab === "url" && (
          <form onSubmit={handleAddUrlSource} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                placeholder="Optional Title (e.g. Official Admissions Page)"
                className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <input
                type="text"
                value={urlAddress}
                onChange={(e) => setUrlAddress(e.target.value)}
                placeholder="https://example.com/scholarship-details"
                className="sm:col-span-2 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#232838] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Protected with server-side SSRF validation and 10s fetch cap.</span>
              <button
                type="submit"
                disabled={!urlAddress.trim() || sources.length >= 8}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Web URL</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Upload PDF / Image */}
        {activeTab === "file" && (
          <div className="space-y-3">
            <label className="relative border-2 border-dashed border-slate-200 dark:border-[#232838] hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-[#0B0D12]/40">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={Boolean(fileProgress) || sources.length >= 8}
              />
              <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to upload or drag and drop brochure PDF or poster image
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Digital PDFs are parsed client-side · Scans and images use browser OCR · Max 10MB
              </p>
            </label>

            {/* OCR/PDF Progress Bar */}
            {fileProgress && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {fileProgress.message}
                  </span>
                  <span className="text-slate-500">{fileProgress.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${fileProgress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {fileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Ingested Sources Cards Grid */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active Source Documents ({sources.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Click &quot;Review Text&quot; on any card to edit OCR output
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#232838] bg-slate-50/50 dark:bg-[#0B0D12]/40">
              <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No sources added yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste text, enter a URL, or click one of the sample scenarios above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-[#232838] bg-slate-50 dark:bg-[#0B0D12] flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {s.id}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 uppercase">
                          {s.kind}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSource(s.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {s.title}
                    </h4>

                    {s.url ? (
                      <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {s.url}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {s.text ? s.text.substring(0, 100) : "[URL will be fetched on analysis]"}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    {s.ocrConfidence !== undefined ? (
                      <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        OCR: {s.ocrConfidence}%
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {s.publishedDate ? `Date: ${s.publishedDate}` : "Undated"}
                      </span>
                    )}

                    {s.text && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSource({
                            source: s,
                            index: idx,
                            imageBase64: cachedImages[s.id],
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Review Text</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            🔒 <strong>Zero Server Storage:</strong> Files are read strictly in your browser. Only extracted text is sent to our serverless Gemini pipeline.
          </span>
          <button
            type="button"
            onClick={onStartAnalysis}
            disabled={!isReadyToAnalyze || isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Sources ({sources.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Preview Modal */}
      {editingSource && (
        <EditablePreviewModal
          isOpen={Boolean(editingSource)}
          sourceTitle={editingSource.source.title}
          sourceKind={editingSource.source.kind}
          initialText={editingSource.source.text}
          ocrConfidence={editingSource.source.ocrConfidence}
          imageBase64={editingSource.imageBase64}
          onSave={handleUpdateSourceText}
          onClose={() => setEditingSource(null)}
        />
      )}
    </section>
  );
};
