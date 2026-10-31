import dns from "node:dns/promises";
import { URL } from "node:url";
import { extractTextFromPdfBuffer } from "./pdfExtractor.js";

export interface FetchedUrlResult {
  url: string;
  title: string;
  text: string;
  publishedDate?: string;
  dateStatus: "found" | "undated" | "possibly_outdated";
  statusCode: number;
}

/**
 * Checks if an IPv4 or IPv6 address is private, loopback, link-local, or cloud metadata.
 */
export function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  if (ip.toLowerCase().startsWith("fc00:") || ip.toLowerCase().startsWith("fd00:")) return true;
  if (ip.toLowerCase().startsWith("fe80:")) return true;

  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return true; // Fail closed
  }

  if (parts[0] === 127) return true; // Loopback
  if (parts[0] === 10) return true;  // Private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // Private
  if (parts[0] === 192 && parts[1] === 168) return true; // Private
  if (parts[0] === 169 && parts[1] === 254) return true; // Link-local & cloud metadata
  if (parts[0] === 0) return true;

  return false;
}

/**
 * Validates target URL against SSRF rules.
 */
export async function validateUrlForSsrf(targetUrl: string): Promise<URL> {
  const parsed = new URL(targetUrl);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Forbidden protocol: ${parsed.protocol}. Only http and https are allowed.`);
  }

  const hostname = parsed.hostname;
  if (!hostname || hostname === "localhost") {
    throw new Error("Invalid or prohibited hostname.");
  }

  if (isPrivateIp(hostname)) {
    throw new Error(`Target resolved to prohibited private/internal address: ${hostname}`);
  }

  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    for (const res of lookupResults) {
      if (isPrivateIp(res.address)) {
        throw new Error(`Target domain ${hostname} resolved to private/internal IP ${res.address}`);
      }
    }
  } catch (err: any) {
    if (err.message?.includes("prohibited") || err.message?.includes("private")) {
      throw err;
    }
    throw new Error(`DNS resolution failed for host ${hostname}: ${err.message}`);
  }

  return parsed;
}

/**
 * Standard browser-like HTTP headers to prevent anti-bot blocking on public government/education portals.
 */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Strips HTML tags, cookie banners, navigation, and prefers main/article prose.
 */
export function extractTextAndMetadataFromHtml(html: string): {
  title: string;
  text: string;
  publishedDate?: string;
} {
  // 1. Title extraction
  let title = "Web Document";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // 2. Published date extraction
  let publishedDate: string | undefined;
  const datePatterns = [
    /<meta[^>]+property=["'](?:article:published_time|og:published_time)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["'](?:date|published_date|pubdate|publication_date)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+itemprop=["'](?:datePublished|dateModified)["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
  ];

  for (const regex of datePatterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      publishedDate = match[1].trim();
      break;
    }
  }

  // 3. Strip non-content and layout elements
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ")
    // Strip cookie banners & GDPR consent overlays
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:cookie|consent|banner|overlay|modal|gdpr|advertisement)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, " ");

  // 4. Prefer main or article if containing substantial text
  let contentHtml = cleaned;
  const mainMatch = cleaned.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  if (mainMatch && mainMatch[1] && mainMatch[1].replace(/<[^>]+>/g, " ").trim().length > 300) {
    contentHtml = mainMatch[1];
  } else {
    const contentDivMatch = cleaned.match(/<div[^>]*(?:id|class)=["'][^"']*(?:content|main-content|entry-content|post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (contentDivMatch && contentDivMatch[1] && contentDivMatch[1].replace(/<[^>]+>/g, " ").trim().length > 300) {
      contentHtml = contentDivMatch[1];
    }
  }

  // 5. Convert paragraphs and line breaks to spaces/newlines
  contentHtml = contentHtml
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // 6. Strip all remaining HTML tags
  let text = contentHtml.replace(/<[^>]+>/g, " ");

  // 7. Unescape standard HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // 8. Collapse whitespace
  text = text.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();

  // Cap at 35,000 characters
  if (text.length > 35000) {
    text = text.substring(0, 35000) + "\n... [content truncated for length]";
  }

  return { title, text, publishedDate };
}

/**
 * Safely fetches a remote URL with SSRF protection on EVERY redirect hop,
 * proper charset decoding, browser-like headers, and PDF support.
 */
export async function safeFetchUrl(urlStr: string): Promise<FetchedUrlResult> {
  let currentUrl = urlStr;
  let redirectCount = 0;
  const MAX_REDIRECTS = 5;

  while (redirectCount <= MAX_REDIRECTS) {
    const validatedUrl = await validateUrlForSsrf(currentUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    let response: globalThis.Response;
    try {
      response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        headers: BROWSER_HEADERS,
        redirect: "manual", // Handle redirects manually to re-verify SSRF on each hop
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        throw new Error("Connection timed out after 12 seconds.");
      }
      throw new Error(`Network error: ${fetchErr.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle redirects with SSRF check on next hop
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Redirect HTTP ${response.status} missing Location header.`);
      }
      const nextUrl = new URL(location, validatedUrl).toString();
      console.log(`[LUMEN FETCH] Following redirect ${response.status} to: ${nextUrl}`);
      currentUrl = nextUrl;
      redirectCount++;
      continue;
    }

    const statusCode = response.status;
    if (!response.ok) {
      const statusText = response.statusText || "Error";
      console.warn(`[LUMEN FETCH] URL "${urlStr}" returned HTTP ${statusCode} (${statusText})`);
      if (statusCode === 403) throw new Error("Access blocked by remote server (HTTP 403 Forbidden).");
      if (statusCode === 404) throw new Error("Document not found (HTTP 404).");
      if (statusCode === 429) throw new Error("Remote server rate limit exceeded (HTTP 429).");
      throw new Error(`Remote server error (HTTP ${statusCode}: ${statusText}).`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    // 1. Support PDF URLs
    if (contentType.includes("application/pdf") || validatedUrl.pathname.toLowerCase().endsWith(".pdf")) {
      const arrayBuf = await response.arrayBuffer();
      // Cap at 8MB
      if (arrayBuf.byteLength > 8 * 1024 * 1024) {
        throw new Error("PDF file exceeds size limit (8MB).");
      }
      const text = await extractTextFromPdfBuffer(arrayBuf);
      const filename = validatedUrl.pathname.split("/").pop() || "PDF Document";
      console.log(`[LUMEN FETCH] URL: "${urlStr}" -> HTTP ${statusCode} | ${text.length} chars | Title: "${filename}"`);
      return {
        url: urlStr,
        title: filename,
        text,
        dateStatus: "undated",
        statusCode,
      };
    }

    // 2. Decode text/HTML or text/plain
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml") &&
      !contentType.includes("application/json")
    ) {
      throw new Error(`Unsupported content type: ${contentType}. Expected HTML or PDF.`);
    }

    // Extract charset from content-type or default to utf-8
    let charset = "utf-8";
    const charsetMatch = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
    if (charsetMatch && charsetMatch[1]) {
      charset = charsetMatch[1].trim();
    }

    const rawBuffer = await response.arrayBuffer();
    if (rawBuffer.byteLength > 3 * 1024 * 1024) {
      throw new Error("Page payload exceeds the maximum size limit of 3MB.");
    }

    let decodedHtml: string;
    try {
      decodedHtml = new TextDecoder(charset).decode(rawBuffer);
    } catch {
      decodedHtml = new TextDecoder("utf-8").decode(rawBuffer);
    }

    const { title, text, publishedDate } = extractTextAndMetadataFromHtml(decodedHtml);

    console.log(`[LUMEN FETCH] URL: "${urlStr}" -> HTTP ${statusCode} | ${text.length} chars | Title: "${title}"`);

    return {
      url: urlStr,
      title: title || validatedUrl.hostname,
      text: text,
      publishedDate,
      dateStatus: publishedDate ? "found" : "undated",
      statusCode,
    };
  }

  throw new Error(`Too many redirects (exceeded limit of ${MAX_REDIRECTS}).`);
}
