import crypto from "node:crypto";
import { scrubApiKey } from "./gemini.js";

/**
 * Persistent Supabase-backed IP Rate Limiter for Lumen API
 *
 * Uses Supabase table `lumen_iprate` so rate-limit state persists reliably
 * across Vercel serverless cold starts and sleep cycles.
 *
 * Policy: Strictly 2 requests per IP address per 5-hour window.
 * After 5 hours have elapsed since `window_start`, the counter resets to 0
 * (so the next request begins a new window with count = 1).
 *
 * Required Supabase table schema (`public.lumen_iprate`):
 *   - ip            TEXT PRIMARY KEY
 *   - request_count INTEGER NOT NULL DEFAULT 1
 *   - window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   - updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
 */

export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000; // 18,000,000 ms
export const MAX_REQUESTS_PER_WINDOW = 2;
export const LIMIT_REACHED_MESSAGE =
  "Your limit is reached. Try back in 5 hours again.";

const SUPABASE_TABLE = "lumen_iprate";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
  resetAt: number;
  formattedWait: string;
  source: "supabase" | "memory-fallback";
  message?: string;
}

interface MemoryRateLimitRecord {
  count: number;
  resetAt: number;
}

interface SupabaseRateLimitRow {
  ip: string;
  request_count: number;
  window_start: string;
  updated_at?: string;
}

// Fallback in-memory map (used only if Supabase env vars are missing or unreachable)
const fallbackRateLimitMap = new Map<string, MemoryRateLimitRecord>();

// Track single-use pipeline stage tokens to prevent replay of a runToken
const consumedRunStages = new Map<string, number>();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of fallbackRateLimitMap.entries()) {
    if (now > record.resetAt) {
      fallbackRateLimitMap.delete(ip);
    }
  }
  for (const [key, exp] of consumedRunStages.entries()) {
    if (now > exp) {
      consumedRunStages.delete(key);
    }
  }
}, 10 * 60 * 1000);

if (cleanupInterval && typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

export function formatResetTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs} hour${hrs > 1 ? "s" : ""} ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  return `${mins} minute${mins !== 1 ? "s" : ""}`;
}

function getSupabaseConfig(): { url: string; key: string } | null {
  const rawUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const url = rawUrl.trim().replace(/\/+$/, "");
  const key = rawKey.trim();

  if (!url || !key) {
    return null;
  }
  return { url, key };
}

export function isSupabaseRateLimitConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

function getSupabaseHeaders(apiKey: string): Record<string, string> {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

/**
 * In-memory fallback rate limiter (2 requests / 5 hours)
 */
function checkMemoryRateLimit(
  ip: string,
  limit: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = FIVE_HOURS_MS
): RateLimitResult {
  const now = Date.now();
  const record = fallbackRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    const resetInSec = Math.ceil(windowMs / 1000);
    fallbackRateLimitMap.set(ip, {
      count: 1,
      resetAt,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetInSec,
      resetAt,
      formattedWait: formatResetTime(resetInSec),
      source: "memory-fallback",
    };
  }

  if (record.count >= limit) {
    const resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSec,
      resetAt: record.resetAt,
      formattedWait: formatResetTime(resetInSec),
      source: "memory-fallback",
      message: LIMIT_REACHED_MESSAGE,
    };
  }

  record.count += 1;
  const resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetInSec,
    resetAt: record.resetAt,
    formattedWait: formatResetTime(resetInSec),
    source: "memory-fallback",
  };
}

/**
 * Persistent Supabase IP Rate Limiter targeting table `lumen_iprate`.
 * Strictly enforces 2 requests per IP within a 5-hour window, resetting after 5 hours.
 */
export async function checkRateLimit(
  ip: string,
  limit: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = FIVE_HOURS_MS
): Promise<RateLimitResult> {
  const config = getSupabaseConfig();
  if (!config) {
    console.warn(
      "[LUMEN RATE LIMIT] SUPABASE_URL / SUPABASE_ANON_KEY not set. Using in-memory fallback."
    );
    return checkMemoryRateLimit(ip, limit, windowMs);
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const headers = getSupabaseHeaders(config.key);
  const encodedIp = encodeURIComponent(ip);
  const baseEndpoint = `${config.url}/rest/v1/${SUPABASE_TABLE}`;

  try {
    // 1. Look up existing IP record in `lumen_iprate`
    const selectRes = await fetch(
      `${baseEndpoint}?ip=eq.${encodedIp}&select=ip,request_count,window_start`,
      {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!selectRes.ok) {
      const errText = scrubApiKey(await selectRes.text().catch(() => ""));
      throw new Error(
        `Supabase SELECT failed (HTTP ${selectRes.status}): ${errText.slice(0, 200)}`
      );
    }

    const rows = (await selectRes.json()) as SupabaseRateLimitRow[];
    const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    // 2. First time seeing this IP -> insert row with request_count = 1
    if (!existing) {
      const insertRes = await fetch(baseEndpoint, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          ip,
          request_count: 1,
          window_start: nowIso,
          updated_at: nowIso,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!insertRes.ok) {
        const errText = scrubApiKey(await insertRes.text().catch(() => ""));
        throw new Error(
          `Supabase INSERT failed (HTTP ${insertRes.status}): ${errText.slice(0, 200)}`
        );
      }

      const resetAt = now + windowMs;
      const resetInSec = Math.ceil(windowMs / 1000);
      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetInSec,
        resetAt,
        formattedWait: formatResetTime(resetInSec),
        source: "supabase",
      };
    }

    // 3. Check whether the 5-hour window has expired
    const windowStartMs = new Date(existing.window_start).getTime();
    const elapsedMs = Number.isFinite(windowStartMs) ? now - windowStartMs : windowMs + 1;

    if (elapsedMs >= windowMs) {
      // 5 hours passed -> reset count to 0 and record this new request as 1
      const resetRes = await fetch(`${baseEndpoint}?ip=eq.${encodedIp}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          request_count: 1,
          window_start: nowIso,
          updated_at: nowIso,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!resetRes.ok) {
        const errText = scrubApiKey(await resetRes.text().catch(() => ""));
        throw new Error(
          `Supabase RESET failed (HTTP ${resetRes.status}): ${errText.slice(0, 200)}`
        );
      }

      const resetAt = now + windowMs;
      const resetInSec = Math.ceil(windowMs / 1000);
      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetInSec,
        resetAt,
        formattedWait: formatResetTime(resetInSec),
        source: "supabase",
      };
    }

    // 4. Within 5-hour window -> check if limit (2) is reached
    const currentCount = Number(existing.request_count) || 0;
    const resetAt = windowStartMs + windowMs;
    const resetInSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInSec,
        resetAt,
        formattedWait: formatResetTime(resetInSec),
        source: "supabase",
        message: LIMIT_REACHED_MESSAGE,
      };
    }

    // 5. Increment request_count in Supabase
    const nextCount = currentCount + 1;
    const updateRes = await fetch(`${baseEndpoint}?ip=eq.${encodedIp}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        request_count: nextCount,
        updated_at: nowIso,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!updateRes.ok) {
      const errText = scrubApiKey(await updateRes.text().catch(() => ""));
      throw new Error(
        `Supabase UPDATE failed (HTTP ${updateRes.status}): ${errText.slice(0, 200)}`
      );
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - nextCount),
      resetInSec,
      resetAt,
      formattedWait: formatResetTime(resetInSec),
      source: "supabase",
    };
  } catch (err: any) {
    console.error(
      "[LUMEN RATE LIMIT] Supabase error, falling back to memory limiter:",
      scrubApiKey(err?.message || String(err))
    );
    return checkMemoryRateLimit(ip, limit, windowMs);
  }
}

/**
 * Pipeline Run Tokens
 *
 * A single click of "Analyze Sources" executes 3 stages:
 *   1. POST /api/extract  (consumes 1 request from Supabase `lumen_iprate`)
 *   2. POST /api/analyze  (authorized via short-lived IP-bound runToken)
 *   3. POST /api/enrich   (authorized via short-lived IP-bound runToken)
 *
 * This guarantees 1 click = 1 counted request (giving users 2 full analyses per 5 hours),
 * while still blocking anyone who attempts to call /api/analyze or /api/enrich directly.
 */
function getSigningSecret(): string {
  const seed =
    process.env.RATE_LIMIT_SIGNING_SECRET ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.GEMINI_API_KEY ||
    "lumen-ephemeral-signing-key";
  return crypto.createHash("sha256").update(`lumen-run-token:${seed}`).digest("hex");
}

export function createRunToken(ip: string): string {
  const runId = crypto.randomBytes(12).toString("hex");
  const exp = Date.now() + 3 * 60 * 1000; // Valid for 3 minutes
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const payload = `${runId}.${exp}.${ipHash}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  return `${payload}.${sig}`;
}

export function verifyAndConsumeRunToken(
  token: string | undefined,
  ip: string,
  stage: "analyze" | "enrich"
): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [runId, expStr, ipHash, sig] = parts;
  const exp = Number(expStr);
  if (!runId || !Number.isFinite(exp) || Date.now() > exp) {
    return false;
  }

  const expectedIpHash = crypto
    .createHash("sha256")
    .update(ip)
    .digest("hex")
    .slice(0, 16);
  if (ipHash !== expectedIpHash) {
    return false;
  }

  const payload = `${runId}.${expStr}.${ipHash}`;
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  try {
    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return false;
    }
  } catch {
    return false;
  }

  // Prevent replay of the same stage token on warm instances
  const stageKey = `${runId}:${stage}`;
  if (consumedRunStages.has(stageKey)) {
    return false;
  }
  consumedRunStages.set(stageKey, exp);
  return true;
}
