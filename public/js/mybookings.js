// My Bookings view
import { $, moneyPKR, statusPill, escapeHTML } from './utils.js';
import { getSession } from './store.js';
import { apiFetch } from './api.js';
import { toast } from './toast.js';
import { ROOM_TIERS } from './data.js';
import { openReceipt } from './receipt.js';

export async function renderMyBookings() {
  const sess = getSession();
  if (!sess || sess.role !== 'user') return;
  const wrap = $('#myBookingsList');
  if (!wrap) return;

  try {
    const data = await apiFetch('/api/bookings/mine');
    const mine = Array.isArray(data?.bookings) ? data.bookings : [];

    if (mine.length === 0) {
      wrap.innerHTML = `
        <div class="card rounded-3xl p-8">
          <div class="text-xs text-white/55">No bookings yet</div>
          <div class="mt-2 font-display text-2xl">Your history will appear here</div>
          <p class="mt-2 text-white/60">Book a hotel to generate a receipt and track your booking status.</p>
          <div class="mt-5">
            <a href="#hotels" class="btn px-5 py-3 rounded-xl text-sm">Browse hotels</a>
          </div>
        </div>
      `;
      return;
    }

    wrap.innerHTML = mine.map(b => myBookingCard(b)).join('');
    mine.forEach(b => {
      const btn = document.getElementById(`openReceipt-${b.bookingCode}`);
      btn?.addEventListener('click', () => openReceipt(b));

      // Phase 3 — cancel button (pending/approved only)
      const cancelBtn = document.getElementById(`cancel-${b.bookingCode}`);
      cancelBtn?.addEventListener('click', async () => {
        if (!confirm(`Cancel booking ${b.bookingCode}?`)) return;
        try {
          await apiFetch(`/api/bookings/${encodeURIComponent(b.bookingCode)}/cancel`, { method: 'POST' });
          toast('good', 'Cancelled', `Booking ${b.bookingCode} has been cancelled.`);
          await renderMyBookings();
        } catch (err) {
          toast('bad', 'Cancel failed', err.message || 'Try again');
        }
      });
    });
  } catch {
    wrap.innerHTML = `
      <div class="card rounded-3xl p-8">
        <div class="text-xs text-white/55">Could not load bookings</div>
        <div class="mt-2 font-display text-2xl">Server connection issue</div>
        <p class="mt-2 text-white/60">Please make sure the backend server is running.</p>
      </div>
    `;
  }
}

function myBookingCard(b) {
  const tier = ROOM_TIERS[b.roomTier]?.label || b.roomTier;
  const canCancel = b.status === 'pending' || b.status === 'approved';
  return `
    <div class="card rounded-3xl p-6 sm:p-7">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div class="text-xs text-white/55">Booking ID</div>
          <div class="mt-1 text-lg font-semibold">${escapeHTML(b.bookingCode)}</div>
          <div class="mt-2 text-sm text-white/75">${escapeHTML(b.hotel.name)} <span class="text-white/45">•</span> ${escapeHTML(tier)}</div>
          <div class="mt-1 text-xs text-white/55">${escapeHTML(b.stay.checkin)} → ${escapeHTML(b.stay.checkout)} • ${b.stay.nights} nights • ${b.stay.guests} guests</div>
        </div>
        <div class="flex flex-col items-start sm:items-end gap-2">
          ${statusPill(b.status)}
          <div class="text-xs text-white/55">Total: <span class="text-white/75">PKR ${moneyPKR(b.pricing.total)}</span></div>
          <div class="flex flex-wrap gap-2">
            <button id="openReceipt-${escapeHTML(b.bookingCode)}" class="btn-ghost px-4 py-2 rounded-xl text-sm">Open receipt</button>
            ${canCancel ? `<button id="cancel-${escapeHTML(b.bookingCode)}" class="btn-ghost px-4 py-2 rounded-xl text-sm" style="border-color: rgba(251,113,133,.25);">Cancel</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}
