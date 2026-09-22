const AppError = require('../utils/AppError');
const { ROOM_MULT, uid, nightsBetween, clamp, bookingRowToDTO } = require('../utils/helpers');
const userRepo = require('../repositories/user.repository');
const hotelRepo = require('../repositories/hotel.repository');
const bookingRepo = require('../repositories/booking.repository');
const bookingEventRepo = require('../repositories/bookingEvent.repository');
const roomTypeRepo = require('../repositories/roomType.repository');

// Field validation lives in validators/booking.validators.js (route middleware).
// This service owns domain rules: auth, hotel exists, availability, pricing, cancellation.

async function createBooking(authId, input) {
  try {
    if (!authId) throw new AppError(401, 'Unauthorized');

    const user = await userRepo.findById(authId);
    if (!user) throw new AppError(401, 'Unauthorized');

    const {
      hotelId,
      roomTier,
      guestName,
      guestEmail,
      phone = '',
      checkin,
      checkout,
      guests: guestsInput = 1,
      requests = ''
    } = input;

    const guests = clamp(parseInt(guestsInput, 10) || 1, 1, 6);

    const nights = nightsBetween(checkin, checkout);
    if (!Number.isFinite(nights) || nights <= 0) {
      throw new AppError(400, 'Check-out must be after check-in');
    }

    const h = await hotelRepo.findById(hotelId);
    if (!h) throw new AppError(404, 'Hotel not found');

    // Phase 3 — double-booking protection (same hotel + tier, active statuses)
    const clash = await bookingRepo.findActiveOverlap({ hotelId, roomTier, checkin, checkout });
    if (clash) {
      throw new AppError(409, 'Selected dates are not available for this room tier');
    }

    const base = Number(h.base_price);
    // Multiplier comes from room_types when available, falls back to defaults
    let mult = ROOM_MULT[roomTier];
    try {
      const rt = await roomTypeRepo.findByHotelAndTier(hotelId, roomTier);
      if (rt) mult = Number(rt.multiplier);
    } catch (e) {
      console.warn('room_types lookup failed, using default multiplier:', e.message);
    }
    const amenity = 1 + Number(h.amenity_boost || 0);
    const ratePerNight = Math.round(base * mult * amenity);

    const guestAdj = 1 + Math.max(0, (guests - 2)) * 0.08;
    const total = Math.round(nights * ratePerNight * guestAdj);

    const bookingCode = uid('NS');

    await bookingRepo.insert({
      booking_code: bookingCode,
      status: 'pending',
      user_id: user.id,
      hotel_id: hotelId,
      room_tier: roomTier,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: phone || null,
      checkin,
      checkout,
      nights,
      guests,
      rate_per_night: ratePerNight,
      total,
      requests: requests || null
    });

    // Audit trail (best-effort — never fails the booking)
    await bookingEventRepo.record({
      booking_code: bookingCode,
      event_type: 'created',
      from_status: null,
      to_status: 'pending',
      actor_role: 'user',
      actor_email: user.email,
      note: 'Booking created'
    });

    return {
      bookingCode,
      createdAt: new Date().toISOString(),
      status: 'pending',
      createdBy: { email: user.email, name: user.name },
      hotel: { id: h.id, name: h.name, location: h.location, city: h.city },
      roomTier,
      guest: { name: guestName, email: guestEmail, phone: phone || '' },
      stay: { checkin, checkout, nights, guests },
      pricing: { ratePerNight, total, currency: 'PKR' },
      requests
    };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Booking failed');
  }
}

async function listMine(authId) {
  try {
    const user = await userRepo.findById(authId);
    if (!user) throw new AppError(401, 'Unauthorized');

    const rows = await bookingRepo.listByUserId(user.id);
    return rows.map(bookingRowToDTO);
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load bookings');
  }
}

// Phase 3 — guests can cancel their own pending/approved bookings
async function cancelBooking(authId, role, code) {
  try {
    const booking = await bookingRepo.findByCode(code);
    // Hide existence of other users' bookings
    if (!booking || (role !== 'admin' && booking.user_id !== authId)) {
      throw new AppError(404, 'Booking not found');
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      throw new AppError(409, 'Only pending or approved bookings can be cancelled');
    }

    await bookingRepo.updateStatus(code, 'cancelled');

    let actorEmail = '';
    try {
      const u = await userRepo.findById(authId);
      actorEmail = u?.email || '';
    } catch { /* best-effort */ }

    await bookingEventRepo.record({
      booking_code: code,
      event_type: 'cancelled',
      from_status: booking.status,
      to_status: 'cancelled',
      actor_role: role,
      actor_email: actorEmail,
      note: role === 'admin' ? 'Cancelled by admin' : 'Cancelled by guest'
    });

    return { ok: true, status: 'cancelled' };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Cancel failed');
  }
}

// Phase 3 — status history for owner or admin
async function getHistory(authId, role, code) {
  try {
    const booking = await bookingRepo.findByCode(code);
    if (!booking || (role !== 'admin' && booking.user_id !== authId)) {
      throw new AppError(404, 'Booking not found');
    }

    const events = await bookingEventRepo.listByCode(code);
    return events.map((e) => ({
      type: e.event_type,
      from: e.from_status,
      to: e.to_status,
      actorRole: e.actor_role || '',
      actorEmail: e.actor_email || '',
      note: e.note || '',
      at: new Date(e.created_at).toISOString()
    }));
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load booking history');
  }
}

module.exports = { createBooking, listMine, cancelBooking, getHistory };
