// Entry point: binds global UI, initializes services, boots the router
import { $ } from './utils.js';
import { ensureDates } from './dates.js';
import { refreshSessionFromAPI, bindAuthUI } from './auth.js';
import { updateSessionUI } from './session.js';
import { hydrateHotelsFromAPI, HOTELS, ratePerNight } from './data.js';
import { initRouter, guardRoute, getHashView } from './router.js';
import { bindHotelsControls, renderHotels, renderLandingHotels } from './hotels.js';
import { bindBookingForm } from './booking.js';
import { bindAdminControls } from './admin.js';
import { bindReceiptUI, openReceipt, closeReceipt } from './receipt.js';
import { bindProfileUI } from './profile.js';

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function bindGlobalUI() {
  $('#mobileMenuBtn').addEventListener('click', () => {
    $('#mobileMenu').classList.toggle('hidden');
  });

  $('#heroQuickDemo').addEventListener('click', () => {
    // Create a sample receipt (not stored) for aesthetics
    const demo = {
      bookingCode: 'NS-DEMO-2467',
      createdAt: new Date().toISOString(),
      status: 'pending',
      hotel: { id: HOTELS[2].id, name: HOTELS[2].name, location: HOTELS[2].location, city: HOTELS[2].city },
      roomTier: 'deluxe',
      guest: { name: 'Demo Guest', email: 'demo@guest.com', phone: '+92 300 0000000' },
      stay: {
        checkin: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        checkout: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        nights: 2,
        guests: 2
      },
      pricing: {
        ratePerNight: ratePerNight(HOTELS[2], 'deluxe'),
        total: ratePerNight(HOTELS[2], 'deluxe') * 2,
        currency: 'PKR'
      },
      requests: 'Quiet room, high floor'
    };
    openReceipt(demo);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReceipt();
  });
}

async function init() {
  bindGlobalUI();
  bindAuthUI();
  bindHotelsControls();
  bindBookingForm();
  bindAdminControls();
  bindReceiptUI();
  bindProfileUI();
  setupReveal();
  ensureDates();

  // Refresh user session state first
  await refreshSessionFromAPI();

  // Fetch dynamic hotel data from PostgreSQL (falls back to built-in list)
  await hydrateHotelsFromAPI();

  updateSessionUI();
  renderHotels();
  renderLandingHotels();

  // initial route
  initRouter();
  guardRoute(getHashView());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
