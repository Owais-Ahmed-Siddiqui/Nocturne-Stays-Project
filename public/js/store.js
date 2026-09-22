// Session persistence (localStorage)
import { LS_KEYS } from './config.js';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function getSession() {
  return loadJSON(LS_KEYS.session, null);
}

export function setSession(sess) {
  saveJSON(LS_KEYS.session, sess);
}

export function clearSession() {
  localStorage.removeItem(LS_KEYS.session);
}

export function setPendingRedirect(hash) {
  const sess = getSession() || {};
  sess.redirectAfterLogin = hash;
  setSession(sess);
}

export function consumeRedirect() {
  const sess = getSession();
  if (sess?.redirectAfterLogin) {
    const h = sess.redirectAfterLogin;
    delete sess.redirectAfterLogin;
    setSession(sess);
    return h;
  }
  return null;
}
