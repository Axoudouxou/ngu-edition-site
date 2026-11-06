const API_BASE = 'https://payment.nguedition.com';
const TOKEN_KEY = 'ngu_author_token';

export function getAuthorToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthorToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthorLoggedIn() {
  return !!getAuthorToken();
}

export async function requestAuthorLogin(email) {
  const res = await fetch(`${API_BASE}/api/author/request-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('request failed');
}

export async function verifyAuthorToken(token) {
  const res = await fetch(`${API_BASE}/api/author/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('invalid link');
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function authorFetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getAuthorToken()}` },
  });
  if (res.status === 401) {
    clearAuthorToken();
    window.location.href = '/auteur';
    throw new Error('Session expirée');
  }
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  return res.json();
}
