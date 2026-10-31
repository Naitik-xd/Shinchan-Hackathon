import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export interface FetchedUrlResult {
  url: string;
  title: string;
  text: string;
  publishedDate?: string;
  dateStatus: "found" | "undated" | "possibly_outdated";
}

/**
 * Checks if an IPv4 or IPv6 address is private, loopback, link-local, or cloud metadata.
 */
export function isPrivateIp(ip: string): boolean {
  // IPv6 loopback and unique local
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  if (ip.toLowerCase().startsWith("fc00:") || ip.toLowerCase().startsWith("fd00:")) return true;
  if (ip.toLowerCase().startsWith("fe80:")) return true;

  // IPv4 mapped IPv6
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    // Unknown format, fail closed for security
    return true;
  }

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 (Current network)
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

  // Check direct IP hostnames
  if (isPrivateIp(hostname)) {
    throw new Error(`Target resolved to prohibited private/internal address: ${hostname}`);
  }

  // DNS lookup to verify resolved IP addresses
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
 * Strips HTML tags, styles, scripts, and extracts clean prose text and meta date
 */
export function extractTextAndMetadataFromHtml(html: string): {
  title: string;
  text: string;
  publishedDate?: string;
} {
  // Title
  let title = "Web Document";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // Detect published or modified dates from meta tags
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

  // Strip script, style, nav, header, footer, noscript, svg
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Unescape standard HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse excessive whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Cap text at 30,000 characters
  if (text.length > 30000) {
    text = text.substring(0, 30000) + "... [truncated]";
  }

  return { title, text, publishedDate };
}

/**
 * Safely fetches a remote URL with SSRF protection, size caps, and timeouts.
 */
export async function safeFetchUrl(urlStr: string): Promise<FetchedUrlResult> {
  const validatedUrl = await validateUrlForSsrf(urlStr);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(validatedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Lumen/1.0",
        Accept: "text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error(`Unsupported content type: ${contentType}. Must be HTML or plain text.`);
    }

    // Limit payload size to 2 MB
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 2 * 1024 * 1024) {
      throw new Error("Page payload exceeds the maximum permitted size of 2MB.");
    }

    const html = await response.text();
    const { title, text, publishedDate } = extractTextAndMetadataFromHtml(html);

    return {
      url: urlStr,
      title: title || validatedUrl.hostname,
      text: text || "No readable content extracted.",
      publishedDate,
      dateStatus: publishedDate ? "found" : "undated",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(`Failed to fetch URL securely: ${err.message}`);
  }
}
