// Fetch wrapper with JWT header + JSON error handling
import { API_BASE } from './config.js';
import { getSession } from './store.js';

export async function apiFetch(path, opts = {}) {
  const sess = getSession();
  const headers = Object.assign({
    'Content-Type': 'application/json'
  }, opts.headers || {});
  if (sess?.token) headers.Authorization = `Bearer ${sess.token}`;

  const res = await fetch(API_BASE + path, {
    ...opts,
    headers
  });

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}
