// Receipt modal — document-style paper receipt + clean A4 print (Save as PDF)
import { $ } from './utils.js';
import { moneyPKR, escapeHTML } from './utils.js';
import { toast } from './toast.js';
import { apiFetch } from './api.js';

const TIER_LABELS = { standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite' };

const STATUS_STYLE = {
  pending:  { text: '#b45309', bg: 'rgba(251,191,36,.16)', label: 'PENDING' },
  approved: { text: '#047857', bg: 'rgba(16,185,129,.14)', label: 'APPROVED' },
  declined: { text: '#be123c', bg: 'rgba(251,113,133,.14)', label: 'DECLINED' },
  cancelled:{ text: '#3f3f46', bg: 'rgba(0,0,0,.06)',     label: 'CANCELLED' }
};

function statusChip(status) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;color:${s.text};background:${s.bg};border:1px solid ${s.text}44;">${s.label}</span>`;
}

function historyBlock(events) {
  if (!events || !events.length) return '';
  return `
    <div style="margin-top:18px;">
      <div class="pr-label">Status history</div>
      <div class="pr-dash" style="margin:8px 0;"></div>
      ${events.map(e => `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;font-size:12px;padding:5px 0;">
          <div>
            ${e.from ? `${escapeHTML(e.from)} → ` : ''}<strong>${escapeHTML(e.to)}</strong>
            ${e.note ? ` <span class="pr-muted">(${escapeHTML(e.note)})</span>` : ''}
          </div>
          <div class="pr-muted">${e.actorRole ? escapeHTML(e.actorRole) : ''}${e.actorEmail ? ` · ${escapeHTML(e.actorEmail)}` : ''} · ${escapeHTML(new Date(e.at).toLocaleString())}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Builds the full paper receipt HTML (used on screen AND for printing → PDF)
function buildReceiptPaper(booking, events) {
  const tier = TIER_LABELS[booking.roomTier] || booking.roomTier;
  const nights = booking.stay.nights;
  return `
  <div class="paper-receipt" id="paperReceipt" style="padding:28px 26px;">
    <!-- Header -->
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:flex-start;">
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="width:42px;height:42px;border-radius:12px;background:#141418;display:grid;place-items:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="pr-brand" style="font-size:20px;font-weight:700;">Nocturne Stays</div>
          <div class="pr-muted" style="font-size:11px;">Luxury hotel bookings · Pay at hotel</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="pr-label">Booking receipt</div>
        <div class="pr-code" style="font-size:16px;font-weight:700;margin-top:2px;">${escapeHTML(booking.bookingCode)}</div>
        <div style="margin-top:6px;">${statusChip(booking.status)}</div>
      </div>
    </div>

    <div class="pr-rule" style="margin:18px 0;"></div>

    <!-- Hotel + stay -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;">
      <div>
        <div class="pr-label">Hotel</div>
        <div style="font-size:17px;font-weight:700;margin-top:4px;">${escapeHTML(booking.hotel.name)}</div>
        <div class="pr-muted" style="font-size:12px;margin-top:2px;">${escapeHTML(booking.hotel.location)}</div>
        <div style="font-size:13px;margin-top:8px;">Room tier: <strong>${escapeHTML(tier)}</strong></div>
      </div>
      <div>
        <div class="pr-label">Guest</div>
        <div style="font-size:15px;font-weight:700;margin-top:4px;">${escapeHTML(booking.guest.name)}</div>
        <div class="pr-muted" style="font-size:12px;">${escapeHTML(booking.guest.email)}</div>
        <div class="pr-muted" style="font-size:12px;">Phone: ${escapeHTML(booking.guest.phone || '—')}</div>
      </div>
      <div>
        <div class="pr-label">Stay</div>
        <div class="pr-code" style="font-size:14px;font-weight:600;margin-top:4px;">${escapeHTML(booking.stay.checkin)} → ${escapeHTML(booking.stay.checkout)}</div>
        <div class="pr-muted" style="font-size:12px;">${nights} night${nights === 1 ? '' : 's'} · ${booking.stay.guests} guest${booking.stay.guests === 1 ? '' : 's'}</div>
        <div class="pr-muted" style="font-size:12px;">Created: ${escapeHTML(new Date(booking.createdAt).toLocaleString())}</div>
      </div>
    </div>

    <div class="pr-dash" style="margin:18px 0;"></div>

    <!-- Pricing -->
    <div class="pr-label">Pricing</div>
    <div style="margin-top:6px;">
      <div class="pr-cell" style="display:flex;justify-content:space-between;font-size:13px;border-bottom:1px dashed rgba(0,0,0,.14);">
        <span class="pr-muted">Rate per night (${escapeHTML(tier)})</span>
        <span class="pr-num">PKR ${moneyPKR(booking.pricing.ratePerNight)}</span>
      </div>
      <div class="pr-cell" style="display:flex;justify-content:space-between;font-size:13px;border-bottom:1px dashed rgba(0,0,0,.14);">
        <span class="pr-muted">Nights</span>
        <span class="pr-num">${nights}</span>
      </div>
      <div class="pr-cell" style="display:flex;justify-content:space-between;font-size:13px;border-bottom:1px dashed rgba(0,0,0,.14);">
        <span class="pr-muted">Guests</span>
        <span class="pr-num">${booking.stay.guests}</span>
      </div>
      <div class="pr-cell" style="display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;">
        <span style="font-weight:700;">Total due at hotel</span>
        <span class="pr-num" style="font-size:22px;font-weight:800;">PKR ${moneyPKR(booking.pricing.total)}</span>
      </div>
      <div class="pr-muted" style="font-size:11px;text-align:right;">No online payment · settle at reception (hotel policy)</div>
    </div>

    ${booking.requests ? `
    <div class="pr-dash" style="margin:18px 0;"></div>
    <div class="pr-label">Special requests</div>
    <div style="font-size:13px;margin-top:6px;">${escapeHTML(booking.requests)}</div>
    ` : ''}

    <div class="pr-dash" style="margin:18px 0;"></div>
    <div style="font-size:12px;line-height:1.7;">
      <strong>Notes</strong>
      <div class="pr-muted">· Present this receipt and a valid ID at check-in.</div>
      <div class="pr-muted">· Booking is confirmed after admin approval (status above updates automatically).</div>
      <div class="pr-muted">· Cancellation is free from My Bookings while status is pending/approved.</div>
    </div>

    ${historyBlock(events)}

    <!-- Footer -->
    <div class="pr-rule" style="margin:22px 0 14px;"></div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:flex-end;">
      <div>
        <div class="pr-muted" style="font-size:11px;">Authorized signature</div>
        <div style="width:180px;border-bottom:1px solid rgba(0,0,0,.35);height:26px;"></div>
      </div>
      <div style="text-align:right;">
        <div class="pr-muted" style="font-size:11px;">Thank you for staying with us</div>
        <div class="pr-muted" style="font-size:10px;margin-top:4px;">Designed By Owais Ahmed 2467-2024</div>
      </div>
    </div>
  </div>`;
}

async function fetchHistory(code) {
  if (!code) return [];
  try {
    const data = await apiFetch(`/api/bookings/${encodeURIComponent(code)}/history`);
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return []; // demo receipts / no permission → omit quietly
  }
}

export async function openReceipt(booking) {
  const modal = $('#receiptModal');
  const card = $('#receiptCard');
  modal.classList.remove('hidden');
  card.classList.remove('modal-in');
  void card.offsetWidth;
  card.classList.add('modal-in');

  // Render paper immediately (fast), then upgrade with history if available
  $('#receiptBody').innerHTML = buildReceiptPaper(booking, []);
  card.querySelector('[data-close="receipt"]')?.focus?.();

  const events = await fetchHistory(booking.bookingCode);
  if (!modal.classList.contains('hidden')) {
    $('#receiptBody').innerHTML = buildReceiptPaper(booking, events);
  }

  const tier = TIER_LABELS[booking.roomTier] || booking.roomTier;
  const plainText =
`Nocturne Stays — Receipt
Booking ID: ${booking.bookingCode}
Status: ${booking.status}
Hotel: ${booking.hotel.name} (${booking.hotel.location})
Room: ${tier}
Guest: ${booking.guest.name} (${booking.guest.email})
Dates: ${booking.stay.checkin} → ${booking.stay.checkout} (${booking.stay.nights} nights)
Guests: ${booking.stay.guests}
Rate/night: PKR ${booking.pricing.ratePerNight}
Total (pay at hotel): PKR ${booking.pricing.total}
Requests: ${booking.requests || 'None'}`;

  // Copy details
  $('#receiptCopy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      toast('good', 'Copied', 'Receipt details copied to clipboard.');
    } catch {
      toast('warn', 'Copy blocked', 'Your browser blocked clipboard access.');
    }
  };

  // Print → Save as PDF (only the paper receipt is printed, clean A4 layout)
  $('#receiptPrint').onclick = () => {
    let root = document.getElementById('printRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'printRoot';
      document.body.appendChild(root);
    }
    root.innerHTML = buildReceiptPaper(booking, events);
    window.print();
  };
}

export function closeReceipt() {
  $('#receiptModal').classList.add('hidden');
}

export function bindReceiptUI() {
  $('#receiptModal').addEventListener('click', (e) => {
    const t = e.target;
    if (t?.dataset?.close === 'receipt') closeReceipt();
  });
}
