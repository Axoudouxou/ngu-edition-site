const API_BASE = 'https://payment.nguedition.com';

/**
 * Ask our backend for a time-limited (7 days) signed download URL for a
 * book's ebook file, given the order reference that was just confirmed paid.
 * Returns null if the payment isn't confirmed for that book, or there's no file.
 */
export async function getEbookSignedLink(bookId, reference) {
  if (!bookId || !reference) return null;
  try {
    const res = await fetch(
      `${API_BASE}/api/ebook-link?book_id=${encodeURIComponent(bookId)}&reference=${encodeURIComponent(reference)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.download_url || null;
  } catch (_) {
    return null;
  }
}
