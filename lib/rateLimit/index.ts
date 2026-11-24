import { DbRateLimiter } from "./dbLimiter";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSec: number;
}

export interface RateLimiter {
  limit(key: string, max: number, windowSec: number): Promise<RateLimitResult>;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export const rateLimiter: RateLimiter = new DbRateLimiter();
