// Wave hosted payment integration (https://payment.nguedition.com)
// All calls happen client-side: create-payment (redirect to Wave) and check-payment (verify).

const PAYMENT_BASE = 'https://payment.nguedition.com';
const ORDER_KEY = 'ngu_order_context';

/**
 * Generate a unique order reference for each purchase attempt.
 * The app has an Order entity (with its own id / payment_intent_id), but that
 * DB record is created AFTER payment. The Wave flow needs a reference BEFORE
 * the order is saved, so we generate a fresh one per click.
 */
export function generateOrderReference() {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `NGU-${rand}`;
}

/** Persist order context across the Wave redirect (bookId, format, amount…). */
export function saveOrderContext(ctx) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(ctx));
  } catch (_) { /* ignore */ }
}

export function getOrderContext() {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_KEY));
  } catch (_) {
    return null;
  }
}

export function clearOrderContext() {
  try {
    sessionStorage.removeItem(ORDER_KEY);
  } catch (_) { /* ignore */ }
}

/**
 * Create a Wave payment and redirect the customer to the Wave checkout page.
 * @param {object} opts { amount, bookId, formatId, title }
 */
export async function initiateWavePayment({ amount, bookId, formatId, title }) {
  const reference = generateOrderReference();
  saveOrderContext({ reference, bookId, formatId, title, amount });

  const res = await fetch(`${PAYMENT_BASE}/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: String(amount),
      currency: 'XOF',
      client_reference: reference,
      book_id: bookId,
      format_id: formatId,
    }),
  });

  if (!res.ok) {
    throw new Error(`create-payment failed: ${res.status}`);
  }

  const data = await res.json();
  const url = data.wave_launch_url;
  if (!url) {
    throw new Error('Réponse sans wave_launch_url');
  }

  // Redirect to Wave hosted checkout
  window.location.href = url;
}

/**
 * Verify a payment status by reference.
 * @returns {Promise<object>} e.g. { status: 'paid', download_url?: string }
 */
export async function checkPayment(clientReference) {
  const res = await fetch(
    `${PAYMENT_BASE}/check-payment/${encodeURIComponent(clientReference)}`
  );
  if (!res.ok) {
    throw new Error(`check-payment failed: ${res.status}`);
  }
  return await res.json();
}
