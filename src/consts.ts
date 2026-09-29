export const BASE_API_URL = 'https://app.pakasir.com';

/** Header carrying the api key on every authenticated v2 call. */
export const API_KEY_HEADER = 'X-Api-Key';

/** Header carrying the project's webhook secret on every webhook delivery. */
export const WEBHOOK_SECRET_HEADER = 'X-Secret';

/** Published API limit: 2 requests per second (create, cancel). */
export const MIN_REQUEST_GAP_MS = 500;

/** Published transaction-status limit: once every 4 seconds per transaction. */
export const STATUS_GAP_MS = 4_000;

export const DEFAULT_TIMEOUT_MS = 20_000;
