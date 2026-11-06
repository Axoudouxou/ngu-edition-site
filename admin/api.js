import { adminFetch } from '@/lib/adminAuth';

/** Appel JSON vers le serveur ; remonte le message d'erreur renvoyé par le serveur. */
export async function api(path, { method = 'GET', body } = {}) {
  const res = await adminFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

/** Réduit une grande photo avant l'envoi (le site n'a pas besoin de 8 Mo pour afficher une couverture). */
export async function shrinkImage(file, maxSide = 1600, quality = 0.85) {
  try {
    if (!file.type || !file.type.startsWith('image/') || /svg|gif/.test(file.type) || file.size < 350 * 1024) return file;
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch (_) {
    return file;
  }
}

export async function upload(path, file) {
  const form = new FormData();
  form.append('file', await shrinkImage(file));
  const res = await adminFetch(path, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

/** Télécharge un fichier protégé par le mot de passe admin. */
export async function downloadFile(path, filename) {
  const res = await adminFetch(path);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

export const fmtDate = (iso) =>
  iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const monthLabel = (m) =>
  new Date(`${m}-01T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export const today = () => new Date().toISOString().slice(0, 10);

export const slugify = (s) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60);

export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const clientName = (o) =>
  o.delivery ? `${o.delivery.first_name} ${o.delivery.last_name}`.trim() || o.customer_email : o.customer_email;

export const waLink = (phone) => `https://wa.me/${String(phone || '').replace(/[^0-9]/g, '')}`;
