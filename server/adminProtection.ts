import { Request } from "express";

interface LoginAttemptState {
  consecutiveFailures: number;
  lockedUntil: number; // timestamp in ms
  lastAttemptAt: number;
}

export class AdminProtectionManager {
  private attempts = new Map<string, LoginAttemptState>();
  private readonly maxFailures = 5;
  private readonly lockDurationMs = 15 * 60 * 1000; // 15 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup of old entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const staleCutoff = now - 60 * 60 * 1000; // 1 hour inactivity
    for (const [ip, state] of this.attempts.entries()) {
      if (now >= state.lockedUntil && state.lastAttemptAt < staleCutoff) {
        this.attempts.delete(ip);
      }
    }
  }

  public getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim().length > 0) {
      const firstIp = forwarded.split(",")[0].trim();
      if (firstIp) return firstIp;
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      const firstIp = forwarded[0].trim();
      if (firstIp) return firstIp;
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim().length > 0) {
      return realIp.trim();
    }

    if (req.ip && req.ip.trim().length > 0) {
      return req.ip.trim();
    }

    return req.socket.remoteAddress || "unknown_ip";
  }

  public isLocked(ip: string): boolean {
    const state = this.attempts.get(ip);
    if (!state) return false;

    const now = Date.now();
    if (state.lockedUntil > now) {
      return true;
    }

    // Lock has expired; reset failures
    if (state.lockedUntil > 0 && now >= state.lockedUntil) {
      state.consecutiveFailures = 0;
      state.lockedUntil = 0;
    }

    return false;
  }

  public recordSuccess(ip: string): void {
    this.attempts.delete(ip);
  }

  public recordFailure(ip: string): { isLocked: boolean; attempts: number } {
    const now = Date.now();
    let state = this.attempts.get(ip);

    if (!state) {
      state = {
        consecutiveFailures: 0,
        lockedUntil: 0,
        lastAttemptAt: now,
      };
      this.attempts.set(ip, state);
    }

    state.lastAttemptAt = now;
    state.consecutiveFailures += 1;

    if (state.consecutiveFailures >= this.maxFailures) {
      state.lockedUntil = now + this.lockDurationMs;
      return { isLocked: true, attempts: state.consecutiveFailures };
    }

    return { isLocked: false, attempts: state.consecutiveFailures };
  }

  // Clear lock for test environments or explicit admin operations
  public resetIp(ip: string): void {
    this.attempts.delete(ip);
  }
}

export const adminProtection = new AdminProtectionManager();
