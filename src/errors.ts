export class PakasirApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, `0` when the gateway was unreachable, `400` for local validation errors. */
    readonly status: number,
    /** Endpoint (with the API key redacted) or operation name. */
    readonly endpoint: string,
  ) {
    super(message);
    this.name = 'PakasirApiError';
  }
}

/** 404 from the gateway, e.g. an unknown `txn_id`. */
export class PakasirNotFoundError extends PakasirApiError {
  constructor(endpoint: string, message = 'Transaction not found') {
    super(message, 404, endpoint);
    this.name = 'PakasirNotFoundError';
  }
}

/** The webhook body is not a valid Pakasir v2 payload. */
export class PakasirWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PakasirWebhookError';
  }
}
