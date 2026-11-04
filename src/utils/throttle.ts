import { MIN_REQUEST_GAP_MS, STATUS_GAP_MS } from '../consts';

export interface ThrottleOptions {
  minGapMs?: number;
  perKeyGapMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * In-process pacing for Pakasir v2's published limits: one request slot every 500 ms
 * (2 req/s) and, for a keyed call (a txn_id on transaction-status), 4 s between calls.
 * Slots are reserved synchronously so concurrent callers queue instead of bursting.
 */
export class PakasirThrottle {
  private nextSlot = 0;
  private readonly lastByKey = new Map<string, number>();
  private readonly minGapMs: number;
  private readonly perKeyGapMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: ThrottleOptions = {}) {
    this.minGapMs = opts.minGapMs ?? MIN_REQUEST_GAP_MS;
    this.perKeyGapMs = opts.perKeyGapMs ?? STATUS_GAP_MS;
    this.now = opts.now ?? Date.now;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  async acquire(key?: string): Promise<void> {
    if (key) {
      const now = this.now();
      const last = this.lastByKey.get(key);
      const at = last === undefined ? now : Math.max(now, last + this.perKeyGapMs);
      this.lastByKey.set(key, at);
      this.prune(now);
      if (at > now) await this.sleep(at - now);
    }
    const now = this.now();
    const at = Math.max(now, this.nextSlot);
    this.nextSlot = at + this.minGapMs;
    if (at > now) await this.sleep(at - now);
  }

  private prune(now: number): void {
    if (this.lastByKey.size < 1_000) return;
    for (const [k, t] of this.lastByKey) if (t + this.perKeyGapMs <= now) this.lastByKey.delete(k);
  }
}
