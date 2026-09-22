const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

async function listAll() {
  const { data, error } = await db()
    .from('room_types')
    .select('*')
    .order('multiplier', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function findByHotelAndTier(hotelId, tier) {
  const { data, error } = await db()
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('tier', tier)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { listAll, findByHotelAndTier };
