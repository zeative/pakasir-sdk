import { API_KEY_HEADER, BASE_API_URL, DEFAULT_TIMEOUT_MS, STATUS_GAP_MS } from '../consts';
import { PakasirApiError, PakasirNotFoundError } from '../errors';
import {
  CancelResult,
  CreateMethod,
  PakasirConfig,
  PAYMENT_METHOD_LIMITS,
  PaymentFees,
  PaymentLink,
  PaymentLinkOptions,
  PaymentMethod,
  Transaction,
  TransactionDetail,
} from '../types';
import { paymentLinkUrl, redact, withPaymentLinkOptions } from '../utils/helpers';
import { PakasirThrottle } from '../utils/throttle';

export interface WatchOptions {
  /** Polling interval in ms. Clamped to at least 4000 (Pakasir allows one status call per 4 s per transaction). Default 5000. */
  interval?: number;
  /** Auto-stop after this many ms. Default 600000 (10 minutes). */
  timeout?: number;
  /** Called with the first status and on every change. */
  onStatusChange?: (transaction: TransactionDetail) => void;
  onError?: (error: Error) => void;
}

type RequestOptions = { retries?: number; throttleKey?: string; auth?: boolean };

const seg = (v: string | number) => encodeURIComponent(String(v));

/** Rate limiting shows up as 429, a JSON "Rate limit exceeded", or a bare 503. */
const isTransient = (e: unknown) =>
  e instanceof PakasirApiError && !(e instanceof PakasirNotFoundError) && (e.status === 429 || e.status === 503 || /rate limit/i.test(e.message));

export class Pakasir {
  private watchers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private watchTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private lastStatuses: Map<string, string> = new Map();
  private throttle: PakasirThrottle | null;

  constructor(public config: PakasirConfig) {
    this.initialize();
    this.throttle = config.throttle === false ? null : new PakasirThrottle();
  }

  initialize() {
    const { slug, apikey } = this.config ?? ({} as PakasirConfig);

    if (!slug || !apikey) {
      throw new Error('Pakasir config is not valid! "slug" and "apikey" are required.');
    }
  }

  private get baseUrl(): string {
    return (this.config.baseUrl ?? BASE_API_URL).replace(/\/+$/, '');
  }

  private async once<T>(url: string, init: RequestInit, { throttleKey, auth = true }: RequestOptions): Promise<T> {
    if (this.throttle) await this.throttle.acquire(throttleKey);

    const apikey = this.config.apikey;
    const endpoint = redact(url, apikey);
    const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string>) };
    if (auth) headers[API_KEY_HEADER] = apikey;

    const doFetch = this.config.fetch ?? fetch;
    let res: Response;
    try {
      res = await doFetch(url, { ...init, headers, signal: AbortSignal.timeout(this.config.timeout ?? DEFAULT_TIMEOUT_MS) });
    } catch (e) {
      throw new PakasirApiError(`Pakasir unreachable: ${redact(String(e), apikey)}`, 0, endpoint);
    }

    const raw = await res.text();
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      throw new PakasirApiError(`Pakasir returned non-JSON (${res.status}): ${redact(raw.slice(0, 200), apikey)}`, res.status, endpoint);
    }

    if (!res.ok) {
      const message = redact(String((body as { message?: string } | null)?.message ?? `HTTP ${res.status}`), apikey);
      if (res.status === 404) throw new PakasirNotFoundError(endpoint, message === 'HTTP 404' ? undefined : message);
      throw new PakasirApiError(message, res.status, endpoint);
    }

    return body as T;
  }

  /** Reads retry transient rate-limit errors; writes (create, cancel) never retry. */
  private async request<T>(url: string, init: RequestInit, opts: RequestOptions = {}): Promise<T> {
    const retries = opts.retries ?? 0;
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.once<T>(url, init, opts);
      } catch (e) {
        if (!isTransient(e) || attempt >= retries) throw e;
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      }
    }
  }

  private assertEnvironment(tx: { is_sandbox?: boolean }, endpoint: string) {
    const expected = this.config.expectSandbox;
    if (expected === undefined || tx.is_sandbox === expected) return;
    throw new PakasirApiError(`Pakasir environment mismatch: transaction is_sandbox=${tx.is_sandbox}, expected ${expected}`, 409, endpoint);
  }

  private async create<T>(method: CreateMethod, order_id: string, amount: number): Promise<T> {
    const limits = PAYMENT_METHOD_LIMITS[method];
    if (!limits) throw new PakasirApiError(`Unsupported payment method "${method}"`, 400, 'create-transaction');
    if (typeof order_id !== 'string' || !order_id.trim()) throw new PakasirApiError('order_id is required', 400, 'create-transaction');
    if (!Number.isInteger(amount)) throw new PakasirApiError(`Amount must be an integer (IDR), got ${amount}`, 400, 'create-transaction');
    if (amount < limits.min || amount > limits.max) {
      throw new PakasirApiError(`Amount for "${method}" must be between Rp${limits.min} and Rp${limits.max}, got Rp${amount}`, 400, 'create-transaction');
    }

    return this.request<T>(`${this.baseUrl}/api/v2/create-transaction/${seg(this.config.slug)}/${seg(order_id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amount }),
    });
  }

  /**
   * Creates a QRIS or virtual-account transaction. Find-or-create: repeating the call with the
   * same `order_id` and body returns the same transaction. The response carries `txn_id`
   * (keep it; status and cancel use it), the instrument (`qr_string` or `va_number`) and the fee.
   */
  async createTransaction(method: PaymentMethod, order_id: string, amount: number): Promise<Transaction> {
    if ((method as string) === 'payment_link') {
      throw new PakasirApiError('Use createPaymentLink() for the "payment_link" method', 400, 'create-transaction');
    }
    const tx = await this.create<Transaction>(method, order_id, amount);
    if (!tx || typeof tx.txn_id !== 'string' || !tx.txn_id) {
      throw new PakasirApiError('Pakasir create response is missing txn_id', 502, 'create-transaction');
    }
    this.assertEnvironment(tx, 'create-transaction');
    return tx;
  }

  /**
   * Creates a transaction paid on Pakasir's hosted page (`/pay-v2/{txn_id}`). The response
   * only has `txn_id` and `payment_link`; reconcile with `getTransactionStatus` or the webhook.
   */
  async createPaymentLink(order_id: string, amount: number, options: PaymentLinkOptions = {}): Promise<PaymentLink> {
    const res = await this.create<PaymentLink>('payment_link', order_id, amount);
    if (!res || typeof res.txn_id !== 'string' || !res.txn_id) {
      throw new PakasirApiError('Pakasir payment_link response is missing txn_id', 502, 'create-transaction');
    }
    const link = typeof res.payment_link === 'string' && res.payment_link ? res.payment_link : paymentLinkUrl(res.txn_id, {}, this.baseUrl);
    return { txn_id: res.txn_id, payment_link: withPaymentLinkOptions(link, options) };
  }

  /** Builds the hosted payment page URL for an existing `txn_id`. No API call. */
  getPaymentLink(txn_id: string, options: PaymentLinkOptions = {}): string {
    return paymentLinkUrl(txn_id, options, this.baseUrl);
  }

  /**
   * Current status of a transaction. v2 does not check the amount server-side: compare
   * `order_id` and `amount` with your own records before acting on it.
   * Paced to Pakasir's limit of one call per 4 seconds per transaction.
   */
  async getTransactionStatus(txn_id: string): Promise<TransactionDetail> {
    if (typeof txn_id !== 'string' || !txn_id.trim()) throw new PakasirApiError('txn_id is required', 400, 'transaction-status');
    const tx = await this.request<TransactionDetail>(
      `${this.baseUrl}/api/v2/transaction-status/${seg(this.config.slug)}/${seg(txn_id)}`,
      { method: 'GET' },
      { retries: 2, throttleKey: txn_id },
    );
    if (!tx || typeof tx.status !== 'string') {
      throw new PakasirApiError('Pakasir status response is missing status', 502, 'transaction-status');
    }
    this.assertEnvironment(tx, 'transaction-status');
    return tx;
  }

  /** Cancels a pending transaction. */
  async cancelTransaction(txn_id: string): Promise<CancelResult> {
    if (typeof txn_id !== 'string' || !txn_id.trim()) throw new PakasirApiError('txn_id is required', 400, 'cancel-transaction');
    const res = await this.request<CancelResult | null>(`${this.baseUrl}/api/v2/cancel-transaction/${seg(this.config.slug)}/${seg(txn_id)}`, {
      method: 'POST',
    });
    return { message: res?.message ?? '' };
  }

  /**
   * Fee per method for `amount` from the public fee calculator (no API key sent). An estimate
   * for display; the charged fee is the one on the create response. The map may include
   * methods v2 no longer creates (e.g. `atm_bersama_va`).
   */
  async getPaymentFees(amount: number): Promise<PaymentFees> {
    if (!Number.isInteger(amount) || amount <= 0) throw new PakasirApiError(`Amount must be a positive integer, got ${amount}`, 400, 'payment-fee');
    const quote = await this.request<PaymentFees>(`${this.baseUrl}/api/v2/payment-fee/${seg(amount)}`, { method: 'GET' }, { retries: 1, auth: false });
    if (!quote || typeof quote !== 'object') throw new PakasirApiError('Pakasir fee response is not an object', 502, 'payment-fee');
    const fees: PaymentFees = {};
    for (const [k, v] of Object.entries(quote)) if (typeof v === 'number' && Number.isFinite(v)) fees[k] = v;
    return fees;
  }

  /**
   * Polls `getTransactionStatus` and reports status changes. Stops automatically once the
   * transaction is `completed` or `canceled`, on `timeout`, or via `stopWatch`.
   * Prefer the webhook in production; polling spends your rate-limit budget.
   */
  watchTransaction(txn_id: string, options: WatchOptions = {}): void {
    const interval = Math.max(options.interval ?? 5_000, STATUS_GAP_MS);
    const timeout = options.timeout ?? 600_000;

    this.stopWatch(txn_id);

    this.watchTimeouts.set(
      txn_id,
      setTimeout(() => this.stopWatch(txn_id), timeout),
    );

    const checkStatus = async () => {
      try {
        const tx = await this.getTransactionStatus(txn_id);
        if (!this.watchers.has(txn_id)) return;

        if (this.lastStatuses.get(txn_id) !== tx.status) {
          this.lastStatuses.set(txn_id, tx.status);
          options.onStatusChange?.(tx);
        }

        if (tx.status === 'completed' || tx.status === 'canceled') this.stopWatch(txn_id);
      } catch (error) {
        options.onError?.(error as Error);
      }
    };

    this.watchers.set(
      txn_id,
      setInterval(checkStatus, interval),
    );
    checkStatus();
  }

  /** Stops a watcher started with `watchTransaction`. */
  stopWatch(txn_id: string): void {
    const intervalId = this.watchers.get(txn_id);
    if (intervalId) {
      clearInterval(intervalId);
      this.watchers.delete(txn_id);
    }

    const timeoutId = this.watchTimeouts.get(txn_id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.watchTimeouts.delete(txn_id);
    }

    this.lastStatuses.delete(txn_id);
  }

  /** Stops every active watcher. */
  stopAllWatches(): void {
    for (const txn_id of [...this.watchers.keys()]) this.stopWatch(txn_id);
  }
}
