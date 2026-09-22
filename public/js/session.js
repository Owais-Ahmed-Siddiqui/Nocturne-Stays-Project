// Header auth buttons + role-based nav visibility
// NOTE: the session badge (Guest / Not signed in / user) was removed from the header,
// so this module only drives the Login/Logout buttons and nav links now.
import { $, $$ } from './utils.js';
import { getSession } from './store.js';

export function updateSessionUI() {
  const sess = getSession();
  const btnAuth = $('#btnAuth');
  const btnLogout = $('#btnLogout');

  if (sess?.email) {
    btnAuth?.classList.add('hidden');
    btnLogout?.classList.remove('hidden');
  } else {
    btnAuth?.classList.remove('hidden');
    btnLogout?.classList.add('hidden');
  }
  updateNavAuthVisibility();
}

export function updateNavAuthVisibility() {
  const sess = getSession();
  const role = sess?.role;
  const loggedIn = Boolean(sess?.email);
  $$('[data-auth="user"]').forEach(a => a.classList.toggle('hidden', role !== 'user'));
  $$('[data-auth="admin"]').forEach(a => a.classList.toggle('hidden', role !== 'admin'));
  // Phase 5 — "member" links (e.g. Profile) visible to any signed-in user
  $$('[data-auth="member"]').forEach(a => a.classList.toggle('hidden', !loggedIn));
}
