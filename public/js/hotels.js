// Hotels view: landing grid, search/filters, quick booking, detail + reviews
import { $, $$, moneyPKR, nightsBetween, escapeHTML } from './utils.js';
import { getSession, setPendingRedirect } from './store.js';
import { apiFetch } from './api.js';
import { toast } from './toast.js';
import { HOTELS, ROOM_TIERS, ratePerNight } from './data.js';
import {
  getSelectedHotelId, setSelectedHotelId,
  getSelectedTier, setSelectedTier
} from './selection.js';
import { updateBookingTotals } from './booking.js';

let hotelsSortAsc = true;
let cityFilter = 'All';

// Search + rating/price filters (cycle buttons, same pattern as city filter)
let hotelSearch = '';
let ratingIdx = 0;
let priceIdx = 0;

const RATING_CYCLE = [
  { label: 'Any', min: 0 },
  { label: '4.5+', min: 4.5 },
  { label: '4.7+', min: 4.7 },
  { label: '4.9+', min: 4.9 }
];

const PRICE_BANDS = [
  { label: 'Any', test: () => true },
  { label: 'Under 15,000', test: (p) => p < 15000 },
  { label: '15,000 – 25,000', test: (p) => p >= 15000 && p <= 25000 },
  { label: 'Over 25,000', test: (p) => p > 25000 }
];

function matchesSearch(h, qs) {
  if (!qs) return true;
  return h.name.toLowerCase().includes(qs)
    || h.city.toLowerCase().includes(qs)
    || (h.location || '').toLowerCase().includes(qs)
    || (h.about || '').toLowerCase().includes(qs)
    || (h.tagline || '').toLowerCase().includes(qs)
    || (h.tags || []).some(t => String(t).toLowerCase().includes(qs));
}

function resetFilters() {
  hotelSearch = '';
  ratingIdx = 0;
  priceIdx = 0;
  cityFilter = 'All';
  const s = $('#hotelSearch');
  if (s) s.value = '';
  renderHotels();
}

// ─────────────────────── Landing: featured stays ───────────────────────
export function renderLandingHotels() {
  const grid = $('#landingHotelGrid');
  if (!grid) return;

  let featured = HOTELS.filter(h => h.isFeatured);
  if (featured.length < 3) {
    featured = [...HOTELS].sort((a, b) => Number(b.rating) - Number(a.rating));
  }
  featured = featured.slice(0, 3).sort((a, b) => a.from - b.from);

  grid.innerHTML = featured.map(h => `
    <article class="hover-lift card rounded-3xl overflow-hidden group cursor-pointer" tabindex="0" data-landing-id="${escapeHTML(h.id)}">
      <div class="relative aspect-[16/10] overflow-hidden">
        <img class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" loading="lazy" alt="${escapeHTML(h.name)}" src="${escapeHTML(h.image)}" />
        <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(7,10,15,.12), rgba(7,10,15,.88));"></div>
        <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/45 border border-white/15 text-[11px] text-white/85 backdrop-blur-sm">★ ${Number(h.rating).toFixed(1)}</div>
        <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div class="text-[11px] text-white/55">${escapeHTML(h.city)}</div>
          <div class="font-display text-lg sm:text-xl mt-0.5">${escapeHTML(h.name)}</div>
        </div>
      </div>
      <div class="p-4 sm:p-5">
        <p class="text-sm text-white/60 line-clamp-2">${escapeHTML(h.tagline || h.about)}</p>
        <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex flex-wrap gap-1.5">
            ${(h.tags || []).slice(0, 2).map(t => `<span class="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/65">${escapeHTML(t)}</span>`).join('')}
          </div>
          <div class="text-right">
            <div class="text-[10px] text-white/45">From</div>
            <div class="text-sm font-semibold">PKR ${moneyPKR(h.from)}<span class="text-[10px] text-white/45">/night</span></div>
          </div>
        </div>
        <div class="mt-4 btn-ghost px-3 py-2 rounded-xl text-xs text-center group-hover:bg-white/8 transition">View rooms & dates →</div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-landing-id]').forEach(card => {
    const go = () => {
      setSelectedHotelId(card.dataset.landingId);
      location.hash = '#hotels';
      setTimeout(() => selectHotel(card.dataset.landingId, true), 60);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

// ─────────────────────────── Hotels list view ──────────────────────────
export function renderHotels() {
  const grid = $('#hotelGrid');
  if (!grid) return;

  const cities = ['All', ...Array.from(new Set(HOTELS.map(h => h.city)))];
  $('#filterCity').textContent = `Filter: ${cityFilter}`;
  $('#filterRating').textContent = `Rating: ${RATING_CYCLE[ratingIdx].label}`;
  $('#filterPrice').textContent = `Price: ${PRICE_BANDS[priceIdx].label}`;

  const qs = hotelSearch.trim().toLowerCase();
  let list = [...HOTELS];
  if (cityFilter !== 'All') list = list.filter(h => h.city === cityFilter);
  list = list.filter(h => matchesSearch(h, qs));
  if (ratingIdx > 0) list = list.filter(h => Number(h.rating) >= RATING_CYCLE[ratingIdx].min);
  list = list.filter(h => PRICE_BANDS[priceIdx].test(h.from));
  list.sort((a, b) => hotelsSortAsc ? (a.from - b.from) : (b.from - a.from));

  if (!list.find(h => h.id === getSelectedHotelId())) setSelectedHotelId(list[0]?.id || HOTELS[0]?.id);

  // Empty state when filters match nothing
  if (list.length === 0) {
    grid.innerHTML = `
      <div class="card rounded-3xl p-8 sm:col-span-2">
        <div class="text-xs text-white/55">No matches</div>
        <div class="mt-2 font-display text-2xl">No hotels match your filters</div>
        <p class="mt-2 text-white/60">Try a different search term, city, rating, or price band.</p>
        <button id="hotelClearFilters" class="btn mt-5 px-5 py-3 rounded-xl text-sm">Clear all filters</button>
      </div>
    `;
    $('#hotelClearFilters')?.addEventListener('click', resetFilters);

    const fallback = HOTELS.find(h => h.id === getSelectedHotelId()) || HOTELS[0];
    $('#selectedHotelName').textContent = fallback?.name || '—';
    $('#selectedHotelPrice').textContent = fallback ? moneyPKR(fallback.from) : '—';
    $('#selectedHotelDesc').textContent = fallback?.about || 'Pick a hotel from the left to see details here.';
    updateQuickEstimate();
    if (!$('#hotelDetail').classList.contains('hidden')) renderHotelDetail();
    return;
  }

  grid.innerHTML = '';
  list.forEach((h, idx) => {
    const el = document.createElement('article');
    const isSel = h.id === getSelectedHotelId();
    el.className = `hover-lift card rounded-3xl overflow-hidden group cursor-pointer ${isSel ? 'ring-2 ring-white/20' : ''}`;
    el.setAttribute('tabindex', '0');
    el.innerHTML = `
      <div class="relative">
        <div class="aspect-[16/10] overflow-hidden">
          <img class="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-700" loading="lazy" alt="${escapeHTML(h.name)}" src="${escapeHTML(h.image)}">
        </div>
        <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(7,10,15,.15), rgba(7,10,15,.90));"></div>
        <div class="absolute bottom-0 left-0 right-0 p-5">
          <div class="flex items-end justify-between gap-3 flex-wrap">
            <div class="min-w-0">
              <div class="text-xs text-white/55">${escapeHTML(h.location)}</div>
              <div class="mt-1 font-display text-xl truncate">${escapeHTML(h.name)}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                ${(h.tags || []).slice(0, 3).map(t => `<span class="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">${escapeHTML(t)}</span>`).join('')}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-white/55">From</div>
              <div class="text-white/85">PKR <span class="text-2xl font-semibold">${moneyPKR(h.from)}</span></div>
              <div class="text-xs text-white/55">⭐ ${Number(h.rating).toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="p-5">
        <p class="text-sm text-white/60 line-clamp-2">${escapeHTML(h.about)}</p>
        <div class="mt-4 flex items-center justify-between">
          <div class="text-xs text-white/50">Tier ${idx + 1} of ${list.length}</div>
          <button class="btn-ghost px-3 py-2 rounded-xl text-xs">View details →</button>
        </div>
      </div>
    `;
    el.addEventListener('click', () => selectHotel(h.id, true));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectHotel(h.id, true); }
    });
    grid.appendChild(el);
  });

  const selected = HOTELS.find(h => h.id === getSelectedHotelId()) || HOTELS[0];
  $('#selectedHotelName').textContent = selected?.name || '—';
  $('#selectedHotelPrice').textContent = selected ? moneyPKR(selected.from) : '—';
  $('#selectedHotelDesc').textContent = selected?.about || 'Pick a hotel from the left to see details here.';

  const tier = getSelectedTier();
  $$('.roomTierBtn').forEach(b => {
    const active = b.dataset.tier === tier;
    b.classList.toggle('ring-2', active);
    b.classList.toggle('ring-violet-300/30', active);
    b.classList.toggle('bg-white/8', active);
  });

  $('#tierHint').textContent = selected
    ? `${ROOM_TIERS[tier].label}: PKR ${moneyPKR(ratePerNight(selected, tier))}/night`
    : 'Select a tier to see the estimate.';
  updateQuickEstimate();

  if (!$('#hotelDetail').classList.contains('hidden')) renderHotelDetail();

  const cheapest = HOTELS[0];
  if ($('#homeFromPrice') && cheapest) $('#homeFromPrice').textContent = moneyPKR(cheapest.from);

  $('#filterCity').onclick = () => {
    const i = cities.indexOf(cityFilter);
    cityFilter = cities[(i + 1) % cities.length];
    renderHotels();
  };
}

export function selectHotel(id, openDetail = false) {
  setSelectedHotelId(id);
  renderHotels();
  if (openDetail) {
    const detail = $('#hotelDetail');
    detail.classList.remove('hidden');
    detail.classList.remove('drawer-in');
    void detail.offsetWidth;
    detail.classList.add('drawer-in');
    renderHotelDetail();
    setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

export function updateQuickEstimate() {
  const h = HOTELS.find(x => x.id === getSelectedHotelId());
  const inD = $('#quickCheckin')?.value;
  const outD = $('#quickCheckout')?.value;
  if (!h || !inD || !outD) {
    $('#quickEstimate').textContent = 'PKR —';
    return;
  }
  const nights = nightsBetween(inD, outD);
  if (!Number.isFinite(nights) || nights <= 0) {
    $('#quickEstimate').textContent = 'PKR —';
    return;
  }
  const total = nights * ratePerNight(h, getSelectedTier());
  $('#quickEstimate').textContent = `PKR ${moneyPKR(total)}`;
}

// ──────────────────────── Per-hotel guest reviews ──────────────────────
async function loadHotelReviews(hotelId) {
  const wrap = $('#detailReviews');
  if (!wrap) return;
  wrap.innerHTML = '<div class="text-xs text-white/45">Loading reviews…</div>';
  try {
    const data = await apiFetch(`/api/hotels/${encodeURIComponent(hotelId)}/reviews`);
    const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
    if (!reviews.length) {
      wrap.innerHTML = '<div class="text-xs text-white/45">No reviews yet — be the first to stay.</div>';
      return;
    }
    wrap.innerHTML = reviews.map(r => `
      <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold">${escapeHTML(r.title)}</div>
          <div class="text-xs" style="color: rgba(255,255,255,.75);">${'★'.repeat(r.rating)}<span style="opacity:.3;">${'★'.repeat(Math.max(0, 5 - r.rating))}</span></div>
        </div>
        <p class="mt-2 text-sm text-white/65">${escapeHTML(r.comment)}</p>
        <div class="mt-3 flex items-center justify-between gap-2 text-xs text-white/50">
          <span>— ${escapeHTML(r.guestName)}${r.stayLabel ? ` · ${escapeHTML(r.stayLabel)}` : ''}</span>
        </div>
      </div>
    `).join('');
  } catch {
    wrap.innerHTML = '<div class="text-xs text-white/45">Reviews unavailable right now.</div>';
  }
}

// ─────────────────────────── Hotel detail drawer ───────────────────────
export function renderHotelDetail() {
  const h = HOTELS.find(x => x.id === getSelectedHotelId());
  if (!h) return;
  $('#detailImg').src = h.image;
  $('#detailLocation').textContent = h.location;
  $('#detailName').textContent = h.name;
  $('#detailFrom').textContent = moneyPKR(h.from);
  $('#detailAbout').textContent = h.about;
  $('#detailRating').textContent = `⭐ ${Number(h.rating).toFixed(1)} rating`;
  $('#detailTags').innerHTML = (h.tags || []).map(t =>
    `<span class="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">${escapeHTML(t)}</span>`
  ).join('');

  $('#detailHighlights').innerHTML = (h.highlights || []).map(x => `
    <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div class="text-sm font-semibold">${escapeHTML(x.title)}</div>
      <div class="text-xs text-white/55 mt-1">${escapeHTML(x.desc)}</div>
    </div>
  `).join('');

  $('#detailNearby').innerHTML = (h.nearby || []).map(n => `
    <div class="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-white/70">${escapeHTML(n)}</div>
  `).join('');

  loadHotelReviews(h.id);

  // room cards — prefer room_types from the API (h.tiers), fall back to built-ins
  const roomWrap = $('#detailRoomCards');
  roomWrap.innerHTML = '';
  const activeTier = getSelectedTier();
  for (const [tierKey, info] of Object.entries(ROOM_TIERS)) {
    const rt = h.tiers?.[tierKey];
    const price = ratePerNight(h, tierKey);
    const active = tierKey === activeTier;
    const perks = (rt?.perks?.length ? rt.perks : info.perks);
    const label = rt?.name || info.label;
    const card = document.createElement('button');
    card.className = `text-left rounded-2xl border p-4 transition ${active ? 'bg-white/8 border-cyan-300/30 ring-2 ring-cyan-300/20' : 'bg-white/5 border-white/10 hover:bg-white/7'}`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-sm font-semibold">${escapeHTML(label)}</div>
          <div class="text-xs text-white/55 mt-1">${perks.slice(0, 2).map(escapeHTML).join(' • ')}${rt?.capacity ? ` · up to ${Number(rt.capacity)} guests` : ''}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs text-white/55">PKR/night</div>
          <div class="text-lg font-semibold">${moneyPKR(price)}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      setSelectedTier(tierKey);
      renderHotels();
      renderHotelDetail();
    });
    roomWrap.appendChild(card);
  }

  $('#detailBookBtn').onclick = () => {
    location.hash = '#booking';
    setTimeout(() => {
      $('#bookHotel').value = getSelectedHotelId();
      $('#bookTier').value = getSelectedTier();
      updateBookingTotals();
    }, 0);
  };
  $('#detailBackBtn').onclick = () => {
    $('#hotelDetail').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

// ─────────────────────────── Control bindings ──────────────────────────
export function bindHotelsControls() {
  $('#sortPrice').addEventListener('click', () => {
    hotelsSortAsc = !hotelsSortAsc;
    $('#sortPrice').textContent = `Sort: Price ${hotelsSortAsc ? '↑' : '↓'}`;
    renderHotels();
  });

  $$('.roomTierBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      setSelectedTier(btn.dataset.tier);
      renderHotels();
      updateQuickEstimate();
    });
  });

  $('#quickCheckin').addEventListener('change', updateQuickEstimate);
  $('#quickCheckout').addEventListener('change', updateQuickEstimate);
  ['quickCheckin', 'quickCheckout'].forEach(id => {
    $('#' + id).addEventListener('input', updateQuickEstimate);
  });

  $('#hotelSearch').addEventListener('input', () => {
    hotelSearch = $('#hotelSearch').value;
    renderHotels();
  });
  $('#filterRating').addEventListener('click', () => {
    ratingIdx = (ratingIdx + 1) % RATING_CYCLE.length;
    renderHotels();
  });
  $('#filterPrice').addEventListener('click', () => {
    priceIdx = (priceIdx + 1) % PRICE_BANDS.length;
    renderHotels();
  });

  $('#quickBookBtn').addEventListener('click', () => {
    const sess = getSession();
    if (!sess || sess.role !== 'user') {
      setPendingRedirect('#booking');
      toast('warn', 'Login required', 'Login to continue booking.');
      location.hash = '#login';
      return;
    }
    location.hash = '#booking';
    setTimeout(() => {
      $('#bookHotel').value = getSelectedHotelId();
      $('#bookTier').value = getSelectedTier();
      $('#bookCheckin').value = $('#quickCheckin').value;
      $('#bookCheckout').value = $('#quickCheckout').value;
      updateBookingTotals();
    }, 0);
  });
}
