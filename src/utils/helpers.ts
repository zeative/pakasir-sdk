import { BASE_API_URL } from '../consts';
import { PaymentLinkOptions } from '../types';

/** Appends the documented hosted-page options (`qris_only`, `redirect`) to a payment link. Pure. */
export const withPaymentLinkOptions = (link: string, opts: PaymentLinkOptions = {}): string => {
  const url = new URL(link);
  if (opts.qrisOnly) url.searchParams.set('qris_only', '1');
  if (opts.redirect) url.searchParams.set('redirect', opts.redirect);
  return url.toString();
};

/** Builds the hosted payment page URL for a transaction: `https://app.pakasir.com/pay-v2/{txn_id}`. Pure, no API call. */
export const paymentLinkUrl = (txn_id: string, opts: PaymentLinkOptions = {}, baseUrl: string = BASE_API_URL): string => {
  if (!txn_id || !String(txn_id).trim()) throw new Error('txn_id is required!');
  return withPaymentLinkOptions(`${baseUrl.replace(/\/+$/, '')}/pay-v2/${encodeURIComponent(txn_id)}`, opts);
};

/** Removes every occurrence of `secret` from `text`, so keys never reach logs or error messages. */
export const redact = (text: string, secret: string): string => (secret ? text.split(secret).join('***') : text);
