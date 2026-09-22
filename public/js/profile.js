// Profile view: edit name + change password (Phase 5)
import { $ } from './utils.js';
import { getSession, setSession } from './store.js';
import { apiFetch } from './api.js';
import { updateSessionUI } from './session.js';
import { toast } from './toast.js';

export function prepareProfileView() {
  const sess = getSession();
  if (!sess) return;
  $('#profileName').value = sess.name || '';
  $('#profileEmailInput').value = sess.email || '';
  $('#profileRole').textContent = sess.role === 'admin' ? 'Admin' : 'User';
  $('#profileEmail').textContent = sess.email || '—';
}

export function bindProfileUI() {
  $('#profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#profileName').value.trim();
    if (!name) {
      toast('warn', 'Name required', 'Please enter your name.');
      return;
    }
    try {
      const data = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      const sess = getSession();
      setSession({ ...sess, name: data.user.name });
      updateSessionUI();
      toast('good', 'Saved', 'Your profile has been updated.');
    } catch (err) {
      toast('bad', 'Update failed', err.message || 'Try again');
    }
  });

  $('#passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = $('#pwCurrent').value;
    const newPassword = $('#pwNew').value;
    const confirmNew = $('#pwConfirm').value;

    if (newPassword.length < 8) {
      toast('warn', 'Weak password', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNew) {
      toast('bad', 'Mismatch', 'Passwords do not match.');
      return;
    }
    try {
      await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      toast('good', 'Password changed', 'Use your new password next time you login.');
      $('#passwordForm').reset();
    } catch (err) {
      toast('bad', 'Change failed', err.message || 'Try again');
    }
  });
}
