// Admin dashboard view (server-side search, date range, status filter, pagination)
import { $, $$, moneyPKR, statusPill, escapeHTML } from './utils.js';
import { getSession } from './store.js';
import { apiFetch } from './api.js';
import { toast } from './toast.js';
import { ROOM_TIERS } from './data.js';
import { openReceipt } from './receipt.js';
import { renderMyBookings } from './mybookings.js';

let adminStatusFilter = 'all';
let adminPage = 1;
const adminPageSize = 10;
let searchDebounce = null;
let usersLoaded = false; // Phase 5 — users directory fetched once per session

// Phase 5 — admin users directory (fetched once, refreshed after "clear")
async function renderAdminUsers() {
  if (usersLoaded) return;
  try {
    const data = await apiFetch('/api/admin/users');
    const users = Array.isArray(data?.users) ? data.users : [];
    usersLoaded = true;
    $('#adminUsersList').innerHTML = users.map(u => `
      <div class="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold">${escapeHTML(u.name)}</span>
            ${u.role === 'admin'
              ? '<span class="text-[11px] px-2 py-1 rounded-full border border-amber-300/25 bg-amber-400/15 text-amber-200">Admin</span>'
              : '<span class="text-[11px] px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">User</span>'}
          </div>
          <div class="mt-1 text-xs text-white/55">${escapeHTML(u.email)} • joined ${escapeHTML(new Date(u.createdAt).toLocaleDateString())}</div>
        </div>
        <div class="text-xs text-white/55">${u.bookings} booking${u.bookings === 1 ? '' : 's'}${u.pending ? ` • ${u.pending} pending` : ''}</div>
      </div>
    `).join('') || '<div class="text-xs text-white/45">No users yet.</div>';
  } catch {
    $('#adminUsersList').innerHTML = '<div class="text-xs text-white/45">Could not load users.</div>';
  }
}

export async function renderAdmin() {
  const sess = getSession();
  if (!sess || sess.role !== 'admin') return;

  renderAdminUsers(); // Phase 5 — users directory (non-blocking, cached)

  const wrap = $('#adminTable');
  try {
    const q = ($('#adminSearch')?.value || '').trim();
    const from = $('#adminFrom')?.value || '';
    const to = $('#adminTo')?.value || '';

    const params = new URLSearchParams({
      page: String(adminPage),
      pageSize: String(adminPageSize),
      status: adminStatusFilter,
      q,
      from,
      to
    });
    const data = await apiFetch(`/api/admin/bookings?${params.toString()}`);
    const list = Array.isArray(data?.bookings) ? data.bookings : [];
    const stats = data?.stats || {};
    const pages = data?.pages || 1;

    // If the current page fell out of range (filter shrank the list), snap back
    if (data?.page && data.page > pages) {
      adminPage = pages;
      return renderAdmin();
    }

    $('#adminTotal').textContent = stats.total ?? 0;
    $('#adminPending').textContent = stats.pending ?? 0;
    $('#adminApproved').textContent = stats.approved ?? 0;
    $('#adminDeclined').textContent = stats.declined ?? 0;

    if (list.length === 0) {
      wrap.innerHTML = `
        <div class="rounded-3xl bg-white/5 border border-white/10 p-8">
          <div class="text-xs text-white/55">No results</div>
          <div class="mt-2 font-display text-2xl">Nothing to review</div>
          <div class="mt-2 text-white/60">Try changing your status filter, date range, or search query.</div>
        </div>
      `;
      return;
    }

    wrap.innerHTML = list.map(b => adminRow(b)).join('') + paginationHTML(data);

    list.forEach(b => {
      const ap = document.getElementById(`approve-${b.bookingCode}`);
      const de = document.getElementById(`decline-${b.bookingCode}`);
      const rc = document.getElementById(`receipt-${b.bookingCode}`);
      // Cancelled bookings are final — only the receipt is available
      ap?.addEventListener('click', () => updateBookingStatus(b.bookingCode, 'approved'));
      de?.addEventListener('click', () => updateBookingStatus(b.bookingCode, 'declined'));
      rc?.addEventListener('click', () => openReceipt(b));
    });

    const prev = document.getElementById('adminPrev');
    const next = document.getElementById('adminNext');
    prev?.addEventListener('click', () => {
      if (adminPage > 1) { adminPage--; renderAdmin(); }
    });
    next?.addEventListener('click', () => {
      if (adminPage < pages) { adminPage++; renderAdmin(); }
    });
  } catch {
    $('#adminTotal').textContent = '0';
    $('#adminPending').textContent = '0';
    $('#adminApproved').textContent = '0';
    $('#adminDeclined').textContent = '0';
    wrap.innerHTML = `
      <div class="rounded-3xl bg-white/5 border border-white/10 p-8">
        <div class="text-xs text-white/55">Could not load admin data</div>
        <div class="mt-2 font-display text-2xl">Server connection issue</div>
        <p class="mt-2 text-white/60">Please make sure the backend server is running and you are logged in as admin.</p>
      </div>
    `;
  }
}

function paginationHTML(resp) {
  const page = resp.page || 1;
  const pages = resp.pages || 1;
  const total = resp.total ?? 0;
  if (pages <= 1) {
    return `
      <div class="flex items-center justify-between gap-3 pt-2">
        <div class="text-xs text-white/45">${total} booking${total === 1 ? '' : 's'}</div>
      </div>
    `;
  }
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pages;
  return `
    <div class="flex items-center justify-between gap-3 pt-2">
      <button id="adminPrev" class="btn-ghost px-4 py-2 rounded-xl text-sm"${prevDisabled ? ' style="opacity:.4;pointer-events:none"' : ''}>← Prev</button>
      <div class="text-xs text-white/55">Page ${page} of ${pages} • ${total} total</div>
      <button id="adminNext" class="btn-ghost px-4 py-2 rounded-xl text-sm"${nextDisabled ? ' style="opacity:.4;pointer-events:none"' : ''}>Next →</button>
    </div>
  `;
}

function adminRow(b) {
  const tier = ROOM_TIERS[b.roomTier]?.label || b.roomTier;
  return `
    <div class="rounded-3xl bg-white/5 border border-white/10 p-5">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <div class="text-sm font-semibold">${escapeHTML(b.hotel.name)}</div>
            ${statusPill(b.status)}
            <span class="text-xs text-white/55">${escapeHTML(tier)}</span>
          </div>
          <div class="mt-2 text-xs text-white/55">Booking ID: <span class="text-white/75">${escapeHTML(b.bookingCode)}</span> • Created: ${escapeHTML(new Date(b.createdAt).toLocaleString())}</div>
          <div class="mt-2 text-sm text-white/70">Guest: <span class="text-white/85">${escapeHTML(b.guest.name)}</span> <span class="text-white/45">•</span> ${escapeHTML(b.guest.email)}</div>
          <div class="mt-1 text-xs text-white/55">${escapeHTML(b.stay.checkin)} → ${escapeHTML(b.stay.checkout)} • ${b.stay.nights} nights • ${b.stay.guests} guests • Total: PKR ${moneyPKR(b.pricing.total)}</div>
          <div class="mt-2 text-xs text-white/55">Requests: ${b.requests ? escapeHTML(b.requests) : '<span class="text-white/45">None</span>'}</div>
        </div>
        <div class="flex md:flex-col gap-2 md:items-end">
          <button id="receipt-${escapeHTML(b.bookingCode)}" class="btn-ghost px-4 py-2 rounded-xl text-sm">Receipt</button>
          ${b.status === 'cancelled' ? '' : `
          <button id="approve-${escapeHTML(b.bookingCode)}" class="btn px-4 py-2 rounded-xl text-sm" style="background: linear-gradient(135deg, rgba(16,185,129,.85), rgba(34,211,238,.55));">Approve</button>
          <button id="decline-${escapeHTML(b.bookingCode)}" class="btn-ghost px-4 py-2 rounded-xl text-sm" style="border-color: rgba(251,113,133,.25);">Decline</button>`}
        </div>
      </div>
    </div>
  `;
}

async function updateBookingStatus(code, status) {
  try {
    await apiFetch(`/api/admin/bookings/${encodeURIComponent(code)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    toast('good', 'Updated', `Booking ${code} marked as ${status}.`);
    await renderAdmin();
    await renderMyBookings();
  } catch (err) {
    toast('bad', 'Update failed', err.message || 'Try again');
  }
}

export function bindAdminControls() {
  $$('.adminFilter').forEach(btn => {
    btn.addEventListener('click', () => {
      adminStatusFilter = btn.dataset.status;
      adminPage = 1;
      $$('.adminFilter').forEach(b => b.classList.remove('ring-2', 'ring-cyan-300/20', 'bg-white/8'));
      btn.classList.add('ring-2', 'ring-cyan-300/20', 'bg-white/8');
      renderAdmin();
    });
  });
  $('.adminFilter[data-status="all"]').classList.add('ring-2', 'ring-cyan-300/20', 'bg-white/8');

  // Debounced server-side search (avoids burning the rate limit on every keystroke)
  $('#adminSearch').addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      adminPage = 1;
      renderAdmin();
    }, 300);
  });

  // Phase 4 — date range filter
  for (const id of ['adminFrom', 'adminTo']) {
    $('#' + id).addEventListener('change', () => {
      adminPage = 1;
      renderAdmin();
    });
  }
  $('#adminDateClear').addEventListener('click', () => {
    $('#adminFrom').value = '';
    $('#adminTo').value = '';
    adminPage = 1;
    renderAdmin();
  });

  $('#adminExport').addEventListener('click', async () => {
    try {
      const data = await apiFetch('/api/admin/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nocturne-stays-export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('good', 'Exported', 'Downloaded JSON export.');
    } catch (err) {
      toast('bad', 'Export failed', err.message || 'Try again');
    }
  });

  $('#adminClear').addEventListener('click', async () => {
    if (!confirm('Clear all bookings and user accounts?')) return;
    try {
      await apiFetch('/api/admin/clear', { method: 'DELETE' });
      toast('good', 'Cleared', 'Data removed.');
      adminPage = 1;
      usersLoaded = false;
      await renderAdmin();
    } catch (err) {
      toast('bad', 'Clear failed', err.message || 'Try again');
    }
  });
}
