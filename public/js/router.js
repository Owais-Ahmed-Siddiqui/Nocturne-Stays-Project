// Hash router + route guards
import { $ } from './utils.js';
import { getSession, setPendingRedirect } from './store.js';
import { ensureDates } from './dates.js';
import { updateNavAuthVisibility } from './session.js';
import { toast } from './toast.js';
import { renderHotels } from './hotels.js';
import { prepareBookingView } from './booking.js';
import { renderAdmin } from './admin.js';
import { renderMyBookings } from './mybookings.js';
import { prepareProfileView } from './profile.js';

export const VIEWS = ['home', 'hotels', 'login', 'register', 'booking', 'admin', 'mybookings', 'profile', 'help'];

export function getHashView() {
  const hash = location.hash.replace('#', '').trim();
  if (!hash) return 'home';
  const [base] = hash.split('?');
  return VIEWS.includes(base) ? base : 'home';
}

export function showView(name) {
  for (const v of VIEWS) {
    const el = $('#view-' + v);
    if (!el) continue;
    el.classList.toggle('hidden', v !== name);
    if (v === name) {
      // Pro view transition — re-trigger enter animation
      el.classList.remove('view-enter');
      void el.offsetWidth;
      el.classList.add('view-enter');
    }
  }
  // close mobile menu
  $('#mobileMenu')?.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateNavAuthVisibility();

  // view-specific refresh
  if (name === 'hotels') renderHotels();
  if (name === 'booking') prepareBookingView();
  if (name === 'admin') renderAdmin();
  if (name === 'mybookings') renderMyBookings();
  if (name === 'profile') prepareProfileView();

  // ensure dates set
  ensureDates();
}

export function guardRoute(view) {
  const sess = getSession();
  if (view === 'booking') {
    if (!sess || sess.role !== 'user') {
      setPendingRedirect('#booking');
      location.hash = '#login';
      toast('warn', 'Login required', 'Please login to book a room.');
      return;
    }
  }
  if (view === 'mybookings') {
    if (!sess || sess.role !== 'user') {
      setPendingRedirect('#mybookings');
      location.hash = '#login';
      toast('warn', 'Login required', 'Please login to view your bookings.');
      return;
    }
  }
  if (view === 'admin') {
    if (!sess || sess.role !== 'admin') {
      setPendingRedirect('#admin');
      location.hash = '#login';
      toast('warn', 'Admin access', 'Login as admin to open the dashboard.');
      return;
    }
  }
  if (view === 'profile') {
    // Any signed-in user (user or admin) may open their profile
    if (!sess) {
      setPendingRedirect('#profile');
      location.hash = '#login';
      toast('warn', 'Login required', 'Please login to view your profile.');
      return;
    }
  }
  showView(view);
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    const v = getHashView();
    guardRoute(v);
  });
}
