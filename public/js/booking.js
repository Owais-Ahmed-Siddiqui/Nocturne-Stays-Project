// Booking view: form, live totals, summary, submit
import { $, moneyPKR, nightsBetween, clamp, escapeHTML } from './utils.js';
import { getSession } from './store.js';
import { apiFetch } from './api.js';
import { toast } from './toast.js';
import { ensureDates } from './dates.js';
import { HOTELS, ROOM_TIERS, ratePerNight } from './data.js';
import { getSelectedHotelId, setSelectedHotelId, getSelectedTier, setSelectedTier } from './selection.js';
import { openReceipt } from './receipt.js';

export function prepareBookingView() {
  const sess = getSession();
  // populate hotels
  const sel = $('#bookHotel');
  sel.innerHTML = HOTELS.map(h =>
    `<option value="${h.id}">${escapeHTML(h.name)} — from PKR ${moneyPKR(h.from)}/night</option>`
  ).join('');

  // prefill from session
  $('#bookName').value = sess?.name || '';
  $('#bookEmail').value = sess?.email || '';

  // if arrived from hotel selection, keep it
  if (getSelectedHotelId()) sel.value = getSelectedHotelId();
  $('#bookTier').value = getSelectedTier() || 'standard';

  ensureDates();
  updateBookingTotals();

  // bind listeners (idempotent)
  for (const id of ['bookHotel', 'bookTier', 'bookCheckin', 'bookCheckout', 'bookGuests']) {
    const el = $('#' + id);
    el.oninput = updateBookingTotals;
    el.onchange = updateBookingTotals;
  }
  // Summary live preview
  for (const id of ['bookName', 'bookEmail', 'bookPhone', 'bookRequests']) {
    const el = $('#' + id);
    el.oninput = updateBookingSummary;
  }
  updateBookingSummary();
}

export function updateBookingTotals() {
  const hid = $('#bookHotel').value;
  const tier = $('#bookTier').value;
  const h = HOTELS.find(x => x.id === hid);
  setSelectedHotelId(hid);
  setSelectedTier(tier);

  const checkin = $('#bookCheckin').value;
  const checkout = $('#bookCheckout').value;
  let nights = nightsBetween(checkin, checkout);
  if (!Number.isFinite(nights)) nights = 0;

  const guests = clamp(parseInt($('#bookGuests').value || '1', 10), 1, 6);
  $('#bookGuests').value = guests;

  if (!h || nights <= 0) {
    $('#bookTotal').textContent = 'PKR —';
    updateBookingSummary();
    return;
  }

  const rate = ratePerNight(h, tier);
  // simple guest adjustment: +8% per guest above 2 (capacity/services)
  const guestAdj = 1 + Math.max(0, (guests - 2)) * 0.08;
  const total = Math.round(nights * rate * guestAdj);

  $('#bookTotal').textContent = `PKR ${moneyPKR(total)}`;
  updateBookingSummary({ nights, rate, total });
}

export function updateBookingSummary(calc) {
  const hid = $('#bookHotel')?.value;
  const tier = $('#bookTier')?.value;
  const h = HOTELS.find(x => x.id === hid);
  if (!h) return;

  const checkin = $('#bookCheckin')?.value || '—';
  const checkout = $('#bookCheckout')?.value || '—';
  const guests = $('#bookGuests')?.value || '—';
  const name = $('#bookName')?.value || '—';
  const email = $('#bookEmail')?.value || '—';
  const phone = $('#bookPhone')?.value || '—';
  const requests = ($('#bookRequests')?.value || '').trim();

  const nights = calc?.nights ?? nightsBetween(checkin, checkout);
  const rate = calc?.rate ?? ratePerNight(h, tier);
  const total = calc?.total ?? 0;

  $('#bookingSummary').innerHTML = `
    <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div class="text-xs text-white/55">Hotel</div>
      <div class="mt-1 text-lg font-semibold">${escapeHTML(h.name)}</div>
      <div class="text-xs text-white/55 mt-1">${escapeHTML(h.location)}</div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div class="text-xs text-white/55">Room tier</div>
        <div class="mt-1 text-sm font-semibold">${escapeHTML(ROOM_TIERS[tier]?.label || tier)}</div>
        <div class="mt-1 text-xs text-white/55">Rate: PKR ${moneyPKR(rate)}/night</div>
      </div>
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div class="text-xs text-white/55">Dates</div>
        <div class="mt-1 text-sm font-semibold">${escapeHTML(checkin)} → ${escapeHTML(checkout)}</div>
        <div class="mt-1 text-xs text-white/55">Nights: ${Number.isFinite(nights) && nights > 0 ? nights : '—'}</div>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div class="text-xs text-white/55">Guest</div>
        <div class="mt-1 text-sm font-semibold">${escapeHTML(name)}</div>
        <div class="mt-1 text-xs text-white/55">${escapeHTML(email)}</div>
      </div>
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div class="text-xs text-white/55">Guests</div>
        <div class="mt-1 text-sm font-semibold">${escapeHTML(guests)}</div>
        <div class="mt-1 text-xs text-white/55">Phone: ${escapeHTML(phone)}</div>
      </div>
    </div>

    <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div class="text-xs text-white/55">Special requests</div>
      <div class="mt-2 text-sm text-white/65">${requests ? escapeHTML(requests) : '<span class="text-white/45">None</span>'}</div>
    </div>

    <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-white/55">Estimated total</div>
          <div class="mt-1 text-2xl font-semibold">${total ? ('PKR ' + moneyPKR(total)) : 'PKR —'}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-white/55">Payment</div>
          <div class="text-sm font-semibold">Pay at hotel</div>
        </div>
      </div>
    </div>
  `;
}

async function createBookingFromForm() {
  const sess = getSession();
  if (!sess || sess.role !== 'user') throw new Error('Login required');

  const payload = {
    hotelId: $('#bookHotel').value,
    roomTier: $('#bookTier').value,
    guestName: $('#bookName').value.trim(),
    guestEmail: $('#bookEmail').value.trim().toLowerCase(),
    phone: $('#bookPhone').value.trim(),
    checkin: $('#bookCheckin').value,
    checkout: $('#bookCheckout').value,
    guests: clamp(parseInt($('#bookGuests').value || '1', 10), 1, 6),
    requests: $('#bookRequests').value.trim()
  };

  const data = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
  return data.booking;
}

export function bindBookingForm() {
  $('#bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const booking = await createBookingFromForm();
      toast('good', 'Booked', 'Your booking is created and pending approval.');
      openReceipt(booking);
    } catch (err) {
      toast('bad', 'Booking failed', err.message || 'Try again');
    }
  });
}
