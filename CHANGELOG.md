# Changelog

## 2.0.0

Rewritten for **Pakasir API v2**. Pakasir API v1 is deprecated and is switched off on
**20 October 2026**; 1.x of this SDK only speaks v1 and stops working on that date.

### Breaking changes

- **Auth**: the API key is sent in the `X-Api-Key` header. It is no longer put in request bodies or query strings.
- **Transactions are keyed on `txn_id`**: status, cancel and payment links take the gateway `txn_id` returned by create, not `order_id` + `amount`. Store `txn_id` with your order.
- `createPayment(method, order_id, amount, redirect_url)` → `createTransaction(method, order_id, amount)`. Calls `POST /api/v2/create-transaction/{slug}/{order_id}` (find-or-create) and returns the raw v2 response: `txn_id`, `qr_string`, `va_number`, `fee`, `total_payment`, `expired_at`, `is_sandbox`, `status`, ...
- `payment_number` is gone: use `qr_string` (QRIS) or `va_number` (VA).
- `getPaymentUrl(...)` removed. Hosted pages are now `https://app.pakasir.com/pay-v2/{txn_id}`: use `createPaymentLink(order_id, amount, { qrisOnly, redirect })` to create one, or `getPaymentLink(txn_id, options)` / `paymentLinkUrl(txn_id, options)` to build the URL for an existing transaction.
- `detailPayment(order_id, amount)` → `getTransactionStatus(txn_id)` (`GET /api/v2/transaction-status/{slug}/{txn_id}`). v2 does not check the amount server-side; compare `order_id`/`amount` with your records.
- `cancelPayment(order_id, amount)` → `cancelTransaction(txn_id)`; returns `{ message }` instead of a re-fetched payment.
- `simulationPayment()` removed: v2 documents no simulation endpoint. Pay sandbox transactions from the Pakasir dashboard / hosted page.
- `watchPayment(order_id, amount, opts)` / `stopWatch(order_id, amount)` → `watchTransaction(txn_id, opts)` / `stopWatch(txn_id)`. The interval defaults to 5 s and is clamped to at least 4 s (Pakasir's per-transaction status limit); watching stops automatically on `completed` / `canceled`. `onStatusChange` receives a `TransactionDetail`.
- Payment methods: `atm_bersama_va` and `paypal` are removed, as is the `all` pseudo-method (use `createPaymentLink` for a multi-method hosted page). Supported: `qris`, `bri_va`, `bni_va`, `cimb_niaga_va`, `permata_va`, `maybank_va`, `bnc_va`, `artha_graha_va`, `sampoerna_va`.
- Fees are no longer computed locally. Use the `fee` / `total_payment` on the create response, or `getPaymentFees(amount)` (public `GET /api/v2/payment-fee/{amount}`) for an estimate.
- `order_id` is no longer silently stripped of characters (`sanitizeUrlSafe` removed); it is URL-encoded as-is. The 5-character minimum is gone. Amounts must be integers within the per-method limits (QRIS Rp500–Rp10.000.000, VA Rp10.000–Rp50.000.000, payment link Rp500–Rp50.000.000); violations throw before any request.
- `PaymentPayload` type removed; replaced by `Transaction`, `TransactionDetail`, `PaymentLink`, `CancelResult`, `PaymentFees`, `WebhookPayload`.
- Errors are typed: `PakasirApiError` (`status`, `endpoint`), `PakasirNotFoundError` (404), `PakasirWebhookError`. The API key is redacted from every error message.

### Added

- `verifyWebhook(headerValue, secret)`: constant-time check of the `X-Secret` webhook header (SHA-256 of both sides + `crypto.timingSafeEqual`); fails closed when the secret is unset. `verifyWebhookSecret()` returns the failure reason.
- `parseWebhook(body)`: validates a webhook body (object, JSON string or bytes) into a `WebhookPayload` with `txn_id` and `is_sandbox`.
- In-process pacing to Pakasir's published limits (2 req/s; one status call per 4 s per transaction), on by default (`throttle: false` to disable). Status/fee reads retry transient 429/503 errors; writes never retry.
- Config options: `baseUrl`, `fetch`, `timeout`, `throttle`, `expectSandbox` (reject transactions whose `is_sandbox` does not match).
- Exports `PAYMENT_METHODS`, `PAYMENT_METHOD_LIMITS`, `isPaymentMethod`, `WEBHOOK_SECRET_HEADER`, `API_KEY_HEADER`.
- Test suite (`bun test`) with mocked fetch; `typecheck` script.
