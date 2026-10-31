/**
 * Lightweight server-side PDF text extractor.
 * Attempts extraction using pdfjs-dist; if not possible or unsupported,
 * throws a user-friendly error instructing the user to upload the file directly.
 */

export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<string> {
  try {
    // Dynamic import to prevent startup failure in environments with worker restrictions
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs").catch(
      () => import("pdfjs-dist") as any
    );

    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: true,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const doc = await loadingTask.promise;
    let fullText = "";
    const totalPages = Math.min(doc.numPages, 40); // Cap at 40 pages

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item: any) => item.str || "")
        .filter(Boolean);
      fullText += strings.join(" ") + "\n";
    }

    const trimmed = fullText.trim();
    if (!trimmed || trimmed.length < 50) {
      throw new Error("PDF contains no selectable or extractable text layer.");
    }
    return trimmed;
  } catch (err: any) {
    console.warn("[LUMEN SERVER] PDF extraction could not parse document:", err?.message || err);
    throw new Error("PDF links aren't supported, upload the file instead");
  }
}
