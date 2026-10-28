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

export async function upload(path, file) {
  const form = new FormData();
  form.append('file', file);
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
