const API_BASE = 'https://payment.nguedition.com';
const TOKEN_KEY = 'ngu_admin_token';

export function saveAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdminLoggedIn() {
  return !!getAdminToken();
}

export async function adminLogin(password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Mot de passe incorrect');
  const data = await res.json();
  saveAdminToken(data.token);
  return data.token;
}

/** Wrapper around fetch that adds the admin Authorization header
 *  and redirects to login if the session has expired. */
export async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    window.location.href = '/admin/login';
    throw new Error('Session expirée');
  }
  return res;
}

export async function adminFetchJson(path, options = {}) {
  const res = await adminFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  return res.json();
}
