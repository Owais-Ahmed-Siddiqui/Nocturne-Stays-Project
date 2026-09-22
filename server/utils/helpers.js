// Shared pure helpers used across services and DTO mapping.

const ROOM_MULT = {
  standard: 1.0,
  deluxe: 1.35,
  suite: 1.85
};

function uid(prefix = 'NS') {
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function nightsBetween(checkin, checkout) {
  const a = new Date(checkin);
  const b = new Date(checkout);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseJSONField(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function bookingRowToDTO(row) {
  return {
    bookingCode: row.booking_code,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    status: row.status,
    createdBy: { email: row.user_email, name: row.user_name },
    hotel: {
      id: row.hotel_id,
      name: row.hotel_name,
      location: row.hotel_location,
      city: row.hotel_city
    },
    roomTier: row.room_tier,
    guest: { name: row.guest_name, email: row.guest_email, phone: row.guest_phone },
    stay: {
      checkin: new Date(row.checkin).toISOString().slice(0, 10),
      checkout: new Date(row.checkout).toISOString().slice(0, 10),
      nights: row.nights,
      guests: row.guests
    },
    pricing: { ratePerNight: row.rate_per_night, total: row.total, currency: 'PKR' },
    requests: row.requests || ''
  };
}

module.exports = { ROOM_MULT, uid, nightsBetween, clamp, parseJSONField, bookingRowToDTO };
