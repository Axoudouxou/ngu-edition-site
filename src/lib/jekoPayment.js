// JEKO hosted payment integration (https://payment.nguedition.com)
// All calls happen client-side: create-payment (redirect to JEKO) and check-payment (verify).

const PAYMENT_BASE = 'https://payment.nguedition.com';
const ORDER_KEY = 'ngu_order_context';

export function generateOrderReference() {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `NGU-${rand}`;
}

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
 * Create a JEKO payment and redirect the customer to the JEKO checkout page.
 * @param {object} opts { amount, bookId, formatId, title, customerEmail, paymentMethod }
 * paymentMethod: 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo'
 */
export async function initiateJekoPayment({ amount, bookId, formatId, title, customerEmail, paymentMethod }) {
  const reference = generateOrderReference();
  saveOrderContext({ reference, bookId, formatId, title, amount, customerEmail });

  const res = await fetch(`${PAYMENT_BASE}/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: String(amount),
      currency: 'XOF',
      client_reference: reference,
      book_id: bookId,
      format_id: formatId,
      customer_email: customerEmail || '',
      payment_method: paymentMethod || 'wave',
    }),
  });

  if (!res.ok) {
    throw new Error(`create-payment failed: ${res.status}`);
  }

  const data = await res.json();
  const url = data.redirectUrl;
  if (!url) {
    throw new Error('Réponse sans redirectUrl');
  }

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
