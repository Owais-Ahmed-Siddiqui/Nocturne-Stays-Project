const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

const JOIN_SELECT = `
  *,
  user:users!user_id(name, email),
  hotel:hotels!hotel_id(name, city, location)
`;

// Flatten Supabase join objects into the flat keys bookingRowToDTO expects.
function flatten(b) {
  return {
    ...b,
    user_name: b.user?.name || '',
    user_email: b.user?.email || '',
    hotel_name: b.hotel?.name || '',
    hotel_city: b.hotel?.city || '',
    hotel_location: b.hotel?.location || ''
  };
}

async function insert(row) {
  const { error } = await db().from('bookings').insert([row]);
  if (error) throw error;
}

async function findByCode(code) {
  const { data, error } = await db()
    .from('bookings')
    .select('*')
    .eq('booking_code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Phase 3 — availability check: any active (pending/approved) booking for the
// same hotel + tier whose dates overlap [checkin, checkout).
// Standard overlap: existing.checkin < new.checkout AND existing.checkout > new.checkin
async function findActiveOverlap({ hotelId, roomTier, checkin, checkout }) {
  const { data, error } = await db()
    .from('bookings')
    .select('booking_code, checkin, checkout, status')
    .eq('hotel_id', hotelId)
    .eq('room_tier', roomTier)
    .in('status', ['pending', 'approved'])
    .lt('checkin', checkout)
    .gt('checkout', checkin)
    .limit(1);
  if (error) throw error;
  return (data || [])[0] || null;
}

async function listByUserId(userId) {
  const { data, error } = await db()
    .from('bookings')
    .select(JOIN_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(flatten);
}

async function listAllWithJoins() {
  const { data, error } = await db()
    .from('bookings')
    .select(JOIN_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(flatten);
}

// Phase 4 — server-side filtering + pagination for the admin queue.
// Filters: status, free-text q (code/guest/email/hotel name), created_at date range.
async function listFiltered({ status, q, from, to, page, pageSize }) {
  const client = db();
  let query = client
    .from('bookings')
    .select(JOIN_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (from) query = query.gte('created_at', `${from}T00:00:00`);
  if (to) query = query.lte('created_at', `${to}T23:59:59.999`);

  if (q) {
    // Strip characters that could break PostgREST or() syntax
    const safe = q.replace(/[",()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (safe) {
      const clauses = [
        `booking_code.ilike.%${safe}%`,
        `guest_name.ilike.%${safe}%`,
        `guest_email.ilike.%${safe}%`
      ];
      // Also match hotel names (embedded resource — resolve ids first)
      try {
        const { data: hotels } = await client.from('hotels').select('id').ilike('name', `%${safe}%`);
        const ids = (hotels || [])
          .map((h) => String(h.id))
          .filter((id) => /^[A-Za-z0-9_-]+$/.test(id));
        if (ids.length) clauses.push(`hotel_id.in.(${ids.join(',')})`);
      } catch { /* hotel-name matching is best-effort */ }
      query = query.or(clauses.join(','));
    }
  }

  const offset = (page - 1) * pageSize;
  const { data, count, error } = await query.range(offset, offset + pageSize - 1);
  if (error) throw error;
  return { rows: (data || []).map(flatten), total: count || 0 };
}

// Lightweight status column scan — used to build dashboard stats
async function listAllStatuses() {
  const { data, error } = await db().from('bookings').select('status');
  if (error) throw error;
  return (data || []).map((r) => r.status);
}

// Phase 5 — per-user booking counts for the admin users directory
async function listOwnerStats() {
  const { data, error } = await db().from('bookings').select('user_id, status');
  if (error) throw error;
  return data || [];
}

async function updateStatus(code, status) {
  const { data, error } = await db()
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('booking_code', code)
    .select('booking_code');
  if (error) throw error;
  return data || [];
}

async function deleteAll() {
  const { error } = await db().from('bookings').delete().neq('booking_code', '');
  if (error) throw error;
}

async function listRaw() {
  const { data, error } = await db()
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

module.exports = {
  insert,
  findByCode,
  findActiveOverlap,
  listByUserId,
  listAllWithJoins,
  listFiltered,
  listAllStatuses,
  listOwnerStats,
  updateStatus,
  deleteAll,
  listRaw
};
