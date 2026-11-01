/**
 * Rate Limiter for Lumen API
 * Enforces a strict quota of 7 requests per 5 hours per IP address
 * to protect Gemini upstream quota and prevent API abuse.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// 5 hours in milliseconds
export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
export const MAX_REQUESTS_PER_WINDOW = 7;

// Periodically clean up expired entries every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// Prevent cleanup interval from holding process open in test/script contexts
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

export function checkRateLimit(
  ip: string,
  limit: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = FIVE_HOURS_MS
): {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
  resetAt: number;
  formattedWait: string;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(ip, {
      count: 1,
      resetAt,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSec: Math.ceil(windowMs / 1000),
      resetAt,
      formattedWait: formatResetTime(Math.ceil(windowMs / 1000)),
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
  };
}
