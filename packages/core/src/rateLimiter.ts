/**
 * Rate Limiter — Token-bucket throttle for OpenAI API calls
 *
 * Prevents hitting OpenAI rate limits by enforcing a configurable
 * maximum number of requests per time window. Uses a simple
 * sliding-window counter with automatic reset.
 *
 * Default: 20 requests per 60 seconds (well within GPT-4o tier-1 limits).
 */

import { createLogger } from './logger';

const logger = createLogger('RateLimiter');

interface RateLimiterOptions {
  /** Maximum requests allowed per window (default: 20) */
  maxRequests?: number;
  /** Window duration in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private timestamps: number[] = [];

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 20;
    this.windowMs = options.windowMs ?? 60_000;
  }

  /**
   * Wait until a request slot is available, then consume it.
   * Returns immediately if under the limit, otherwise waits.
   */
  async acquire(): Promise<void> {
    this.cleanup();

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const waitMs = oldest + this.windowMs - Date.now();

      if (waitMs > 0) {
        logger.warn('Rate limit reached, throttling', {
          currentRequests: this.timestamps.length,
          maxRequests: this.maxRequests,
          waitMs,
        });
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        this.cleanup();
      }
    }

    this.timestamps.push(Date.now());
    logger.debug('Request slot acquired', {
      used: this.timestamps.length,
      max: this.maxRequests,
    });
  }

  /** Remove timestamps outside the current window */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }

  /** Current usage stats */
  get stats() {
    this.cleanup();
    return {
      used: this.timestamps.length,
      remaining: Math.max(0, this.maxRequests - this.timestamps.length),
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

/** Shared singleton for OpenAI calls across the application */
export const openaiRateLimiter = new RateLimiter({
  maxRequests: parseInt(process.env.OPENAI_RATE_LIMIT || '20', 10),
  windowMs: parseInt(process.env.OPENAI_RATE_WINDOW_MS || '60000', 10),
});
