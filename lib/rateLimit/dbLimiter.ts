import { prisma } from "@/lib/prisma";
import type { RateLimitResult, RateLimiter } from "./index";

export class DbRateLimiter implements RateLimiter {
  async limit(key: string, max: number, windowSec: number): Promise<RateLimitResult> {
    const now = new Date();
    const nextResetAt = new Date(now.getTime() + windowSec * 1000);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({ where: { key } });

      if (!existing || existing.resetAt <= now) {
        const record = await tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt: nextResetAt },
          update: { count: 1, resetAt: nextResetAt },
        });
        return {
          success: true,
          remaining: Math.max(0, max - record.count),
          resetAt: record.resetAt,
          retryAfterSec: 0,
        };
      }

      if (existing.count >= max) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
        );
        return {
          success: false,
          remaining: 0,
          resetAt: existing.resetAt,
          retryAfterSec,
        };
      }

      const updated = await tx.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return {
        success: true,
        remaining: Math.max(0, max - updated.count),
        resetAt: updated.resetAt,
        retryAfterSec: 0,
      };
    });
  }
}
