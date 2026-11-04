/**
 * Pakasir API v2 shapes, taken from https://pakasir.com/p/create-transaction,
 * /p/transaction-status, /p/webhook, /p/cancel-transaction and /p/fee-calculator.
 */

export type PakasirConfig = {
  /** Project slug (Project Details page). */
  slug: string;
  /** Project API key (Project Details page). Sent as the `X-Api-Key` header. */
  apikey: string;
  /** Override the API origin. Defaults to `https://app.pakasir.com`. */
  baseUrl?: string;
  /** Custom fetch implementation (tests, proxies). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Per-request timeout in milliseconds. Defaults to 20000. */
  timeout?: number;
  /**
   * Pace requests in-process to Pakasir's published limits (2 req/s overall, one
   * transaction-status call per 4 s per transaction). Defaults to `true`.
   */
  throttle?: boolean;
  /**
   * When set, every create/status response whose `is_sandbox` differs from this value is
   * rejected with a `PakasirApiError` (guards against a misconfigured slug/API key).
   */
  expectSandbox?: boolean;
};

/** Methods that return a payable instrument (QRIS string or VA number). `atm_bersama_va` was removed in v2. */
export const PAYMENT_METHODS = [
  'qris',
  'bri_va',
  'bni_va',
  'cimb_niaga_va',
  'permata_va',
  'maybank_va',
  'bnc_va',
  'artha_graha_va',
  'sampoerna_va',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Every `method` accepted by create-transaction: the instrument methods plus the hosted `payment_link`. */
export type CreateMethod = PaymentMethod | 'payment_link';

export const isPaymentMethod = (v: unknown): v is PaymentMethod => typeof v === 'string' && (PAYMENT_METHODS as readonly string[]).includes(v);

/** Per-method amount limits from the create-transaction guide (IDR, inclusive). */
export const PAYMENT_METHOD_LIMITS: Record<CreateMethod, { min: number; max: number }> = {
  payment_link: { min: 500, max: 50_000_000 },
  qris: { min: 500, max: 10_000_000 },
  bri_va: { min: 10_000, max: 50_000_000 },
  bni_va: { min: 10_000, max: 50_000_000 },
  cimb_niaga_va: { min: 10_000, max: 50_000_000 },
  permata_va: { min: 10_000, max: 50_000_000 },
  maybank_va: { min: 10_000, max: 50_000_000 },
  bnc_va: { min: 10_000, max: 50_000_000 },
  artha_graha_va: { min: 10_000, max: 50_000_000 },
  sampoerna_va: { min: 10_000, max: 50_000_000 },
};

/** v2 statuses. `canceled` also covers transactions left unpaid for 24 hours. */
export type TransactionStatus = 'pending' | 'completed' | 'canceled';

/** Response of `POST /api/v2/create-transaction/{slug}/{order_id}` for every method except `payment_link`. */
export type Transaction = {
  /** Gateway transaction id. Status and cancel are keyed on this, not on `order_id`. */
  txn_id: string;
  project: string;
  order_id: string;
  amount: number;
  fee: number;
  /** `amount + fee`: what the customer pays. */
  total_payment: number;
  payment_method: PaymentMethod;
  /** QRIS EMV payload; `""` for virtual accounts. */
  qr_string: string;
  /** Virtual account number; `""` for QRIS. */
  va_number: string;
  /** RFC 3339 UTC timestamp. */
  expired_at: string;
  is_sandbox: boolean;
  status: TransactionStatus | (string & {});
  completed_at: string | null;
};

/** Response of create-transaction with `method: "payment_link"`. */
export type PaymentLink = {
  txn_id: string;
  /** Hosted payment page, e.g. `https://app.pakasir.com/pay-v2/{txn_id}` (with any requested query options). */
  payment_link: string;
};

export type PaymentLinkOptions = {
  /** Restrict the hosted page to QRIS (`?qris_only=1`). */
  qrisOnly?: boolean;
  /** Redirect target for the hosted page (`?redirect=`). */
  redirect?: string;
};

/** Response of `GET /api/v2/transaction-status/{slug}/{txn_id}`. */
export type TransactionDetail = {
  txn_id: string;
  order_id: string;
  amount: number;
  is_sandbox: boolean;
  status: TransactionStatus | (string & {});
  completed_at: string | null;
};

/** Response of `POST /api/v2/cancel-transaction/{slug}/{txn_id}`. */
export type CancelResult = {
  message: string;
};

/** Response of `GET /api/v2/payment-fee/{amount}`: method → fee in IDR. May list methods v2 no longer creates. */
export type PaymentFees = Record<string, number>;

/** Webhook body. Sent only when a payment succeeds, authenticated by the `X-Secret` header. */
export type WebhookPayload = {
  txn_id: string;
  order_id: string;
  amount: number;
  is_sandbox: boolean;
  status: TransactionStatus | (string & {});
  completed_at: string | null;
};
