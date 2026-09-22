// Auth API calls + login/register form bindings
import { $ } from './utils.js';
import { apiFetch } from './api.js';
import { getSession, setSession, clearSession, consumeRedirect } from './store.js';
import { updateSessionUI } from './session.js';
import { toast } from './toast.js';

export async function registerUser(name, email, pass) {
  const payload = { name, email, password: pass };
  await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  return true;
}

export async function loginUser(email, pass, asAdmin) {
  const payload = { email, password: pass, asAdmin: !!asAdmin };
  const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  const user = data.user;
  const sess = {
    token: data.token,
    role: user.role,
    email: user.email,
    name: user.name,
    loginAt: new Date().toISOString()
  };
  setSession(sess);
  return sess;
}

export async function refreshSessionFromAPI() {
  const sess = getSession();
  if (!sess?.token) return;
  try {
    const data = await apiFetch('/api/auth/me');
    const u = data.user;
    setSession({ ...sess, role: u.role, email: u.email, name: u.name });
  } catch {
    // token expired/invalid
    clearSession();
  }
}

export function logout() {
  clearSession();
  updateSessionUI();
  toast('good', 'Logged out', 'You are now signed out.');
  location.hash = '#home';
}

export function bindAuthUI() {
  $('#btnAuth').addEventListener('click', () => location.hash = '#login');
  $('#btnLogout').addEventListener('click', logout);

  $('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#regName').value;
    const email = $('#regEmail').value;
    const p1 = $('#regPassword').value;
    const p2 = $('#regPassword2').value;
    if (p1.length < 8) { toast('warn', 'Weak password', 'Use at least 8 characters.'); return; }
    if (p1 !== p2) { toast('bad', 'Mismatch', 'Passwords do not match.'); return; }
    try {
      await registerUser(name, email, p1);
      toast('good', 'Account created', 'Now login to book rooms.');
      location.hash = '#login';
      $('#loginEmail').value = email.trim().toLowerCase();
    } catch (err) {
      toast('bad', 'Register failed', err.message || 'Try again');
    }
  });

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value;
    const pass = $('#loginPassword').value;
    const asAdmin = $('#loginAsAdmin').checked;
    try {
      await loginUser(email, pass, asAdmin);
      updateSessionUI();
      toast('good', 'Welcome', asAdmin ? 'Admin logged in.' : 'Login successful.');
      const redirect = consumeRedirect();
      location.hash = redirect || (asAdmin ? '#admin' : '#hotels');
    } catch (err) {
      toast('bad', 'Login failed', err.message || 'Try again');
    }
  });
}
