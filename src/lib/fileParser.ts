/**
 * Browser-side file text extraction and OCR.
 * - Digital PDFs: Extracts text using pdfjs-dist.
 * - Scanned PDFs and Images: Lazy-loads tesseract.js for in-browser OCR.
 * - Never uploads binary files to the server.
 */

export interface ParseProgress {
  stage: "reading" | "ocr" | "done" | "error";
  message: string;
  progressPercent: number;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Extracts text from digital PDF file or scanned pages
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (p: ParseProgress) => void
): Promise<{ text: string; pageCount: number; isOcrUsed: boolean; ocrConfidence?: number }> {
  onProgress?.({
    stage: "reading",
    message: "Initializing PDF document...",
    progressPercent: 10,
  });

  const arrayBuffer = await file.arrayBuffer();

  // Dynamically import pdfjs-dist
  const pdfjsLib = await import("pdfjs-dist");

  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let fullText = "";
  let totalChars = 0;
  let scannedPagesCount = 0;
  let ocrConfidenceAccumulator = 0;

  for (let pageNum = 1; pageNum <= Math.min(numPages, 15); pageNum++) {
    onProgress?.({
      stage: "reading",
      message: `Extracting text: Page ${pageNum} of ${numPages}`,
      progressPercent: Math.round(15 + (pageNum / numPages) * 45),
      currentPage: pageNum,
      totalPages: numPages,
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item: any) => item.str || "")
      .filter((s: string) => s.trim().length > 0);

    const pageText = pageStrings.join(" ");
    totalChars += pageText.length;

    // If page has less than 40 characters, it is likely a scanned page
    if (pageText.trim().length < 40) {
      scannedPagesCount++;
      // Render to canvas for OCR
      try {
        onProgress?.({
          stage: "ocr",
          message: `Running OCR on scanned page ${pageNum} of ${numPages}...`,
          progressPercent: Math.round(60 + (pageNum / numPages) * 35),
          currentPage: pageNum,
          totalPages: numPages,
        });

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
          const ocrResult = await runBrowserOcrOnCanvas(canvas);
          fullText += `\n\n[Page ${pageNum} - Scanned OCR]\n${ocrResult.text}`;
          ocrConfidenceAccumulator += ocrResult.confidence;
        }
      } catch (ocrErr) {
        console.warn(`[LUMEN] OCR failed on page ${pageNum}:`, ocrErr);
        fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
      }
    } else {
      fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
    }
  }

  const isOcrUsed = scannedPagesCount > 0;
  const avgOcrConfidence = isOcrUsed
    ? Math.round(ocrConfidenceAccumulator / scannedPagesCount)
    : undefined;

  onProgress?.({
    stage: "done",
    message: "PDF text extraction complete.",
    progressPercent: 100,
  });

  return {
    text: fullText.trim(),
    pageCount: numPages,
    isOcrUsed,
    ocrConfidence: avgOcrConfidence,
  };
}

/**
 * Runs client-side OCR on an image file (PNG, JPG, WebP)
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (p: ParseProgress) => void
): Promise<{ text: string; ocrConfidence: number; imageBase64: string }> {
  onProgress?.({
    stage: "ocr",
    message: "Loading browser OCR engine...",
    progressPercent: 20,
  });

  // Convert image to base64 for preview / vision fallback
  const base64 = await fileToBase64(file);

  const img = new Image();
  img.src = base64;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D canvas context.");
  ctx.drawImage(img, 0, 0);

  onProgress?.({
    stage: "ocr",
    message: "Recognizing text in image...",
    progressPercent: 50,
  });

  const { text, confidence } = await runBrowserOcrOnCanvas(canvas, (pct) => {
    onProgress?.({
      stage: "ocr",
      message: `Recognizing text: ${Math.round(pct)}%`,
      progressPercent: Math.round(50 + pct * 0.45),
    });
  });

  onProgress?.({
    stage: "done",
    message: "Image OCR complete.",
    progressPercent: 100,
  });

  return {
    text: text.trim() || "[No text detected in image]",
    ocrConfidence: Math.round(confidence),
    imageBase64: base64,
  };
}

/**
 * Runs Tesseract.js in browser on a canvas element
 */
async function runBrowserOcrOnCanvas(
  canvas: HTMLCanvasElement,
  onProgressUpdate?: (percent: number) => void
): Promise<{ text: string; confidence: number }> {
  // Dynamic import of Tesseract to avoid heavy bundle hit upfront
  const Tesseract = await import("tesseract.js");

  const worker = await Tesseract.createWorker("eng");
  
  const ret = await worker.recognize(canvas);
  await worker.terminate();

  return {
    text: ret.data.text || "",
    confidence: ret.data.confidence || 0,
  };
}

/**
 * Helper to convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
