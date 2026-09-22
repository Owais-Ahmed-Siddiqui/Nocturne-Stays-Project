const AppError = require('../utils/AppError');
const { parseJSONField } = require('../utils/helpers');
const hotelRepo = require('../repositories/hotel.repository');
const roomTypeRepo = require('../repositories/roomType.repository');
const reviewRepo = require('../repositories/review.repository');

function toDTO(r, tiers) {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    location: r.location,
    tagline: r.tagline || '',
    isFeatured: Boolean(r.is_featured),
    from: Number(r.base_price),
    rating: Number(r.rating),
    tags: parseJSONField(r.tags, []),
    image: r.image,
    about: r.about,
    highlights: parseJSONField(r.highlights, []),
    nearby: parseJSONField(r.nearby, []),
    amenityBoost: Number(r.amenity_boost || 0),
    tiers: tiers || null
  };
}

// Group room_types rows → { hotelId: { standard: {...}, deluxe: {...}, suite: {...} } }
function groupTiers(rows) {
  const map = {};
  for (const rt of rows || []) {
    if (!map[rt.hotel_id]) map[rt.hotel_id] = {};
    map[rt.hotel_id][rt.tier] = {
      multiplier: Number(rt.multiplier),
      name: rt.name,
      description: rt.description || '',
      capacity: Number(rt.capacity || 2),
      perks: parseJSONField(rt.perks, [])
    };
  }
  return map;
}

async function listHotels() {
  try {
    const [rows, typeRows] = await Promise.all([
      hotelRepo.listOrderedByPrice(),
      roomTypeRepo.listAll().catch(() => []) // room_types optional — fall back to built-in tiers
    ]);
    const tiersByHotel = groupTiers(typeRows);
    return rows.map((r) => toDTO(r, tiersByHotel[r.id] || null));
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load hotels');
  }
}

// Phase 6 — per-hotel guest reviews (public)
async function getReviews(hotelId) {
  try {
    const rows = await reviewRepo.listByHotel(hotelId);
    return rows.map((r) => ({
      id: r.id,
      guestName: r.guest_name,
      rating: Number(r.rating),
      title: r.title,
      comment: r.comment,
      stayLabel: r.stay_label || '',
      createdAt: r.created_at
    }));
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load reviews');
  }
}

async function health() {
  const { getDb } = require('../config/database');
  const db = getDb();
  if (!db) throw new AppError(503, 'Database not configured');
  const { error } = await db.from('hotels').select('id').limit(1);
  if (error) throw error;
  return { ok: true, message: 'Database connected' };
}

module.exports = { listHotels, getReviews, health };
