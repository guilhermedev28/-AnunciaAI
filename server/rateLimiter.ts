import { Request, Response, NextFunction } from "express";

interface ClientRecord {
  timestamps: number[];
}

export class RateLimiter {
  private records = new Map<string, ClientRecord>();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(windowMs: number = 60 * 60 * 1000, maxRequests: number = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic cleanup of expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Unref so it does not keep process alive in test runners
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > cutoff);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  public getClientKey(req: Request): string {
    // 1. Try X-Forwarded-For header (standard behind reverse proxies)
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim().length > 0) {
      const firstIp = forwarded.split(",")[0].trim();
      if (firstIp) return firstIp;
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      const firstIp = forwarded[0].trim();
      if (firstIp) return firstIp;
    }

    // 2. Try X-Real-IP
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim().length > 0) {
      return realIp.trim();
    }

    // 3. Fallback to Express req.ip or socket address
    if (req.ip && req.ip.trim().length > 0) {
      return req.ip.trim();
    }

    if (req.socket && req.socket.remoteAddress) {
      return req.socket.remoteAddress;
    }

    // 4. Ultimate fallback to anonymous session ID header if available
    const sessionId = req.headers["x-session-id"];
    if (typeof sessionId === "string" && sessionId.trim().length > 0) {
      return `session_${sessionId.trim()}`;
    }

    return "unknown_client";
  }

  public check(clientKey: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let record = this.records.get(clientKey);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(clientKey, record);
    }

    // Filter to timestamps within current window
    record.timestamps = record.timestamps.filter((t) => t > cutoff);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0] || now;
      const resetTime = oldestInWindow + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Record this request
    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetTime: now + this.windowMs,
    };
  }

  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientKey = this.getClientKey(req);
      const result = this.check(clientKey);

      // Set standard informative rate limit headers
      res.setHeader("X-RateLimit-Limit", this.maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, result.remaining));
      res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000));

      if (!result.allowed) {
        return res.status(429).json({
          error: "rate_limit_exceeded",
          message: "Você atingiu o limite de uso temporário. Aguarde alguns minutos e tente novamente.",
        });
      }

      next();
    };
  }

  public reset(clientKey?: string) {
    if (clientKey) {
      this.records.delete(clientKey);
    } else {
      this.records.clear();
    }
  }

  public getUsage(clientKey: string): number {
    const record = this.records.get(clientKey);
    if (!record) return 0;
    const cutoff = Date.now() - this.windowMs;
    return record.timestamps.filter((t) => t > cutoff).length;
  }
}

// Global instance: 30 requests per IP per 1 hour (60 * 60 * 1000 ms)
export const aiRateLimiter = new RateLimiter(60 * 60 * 1000, 30);
export const aiRateLimitMiddleware = aiRateLimiter.getMiddleware();
