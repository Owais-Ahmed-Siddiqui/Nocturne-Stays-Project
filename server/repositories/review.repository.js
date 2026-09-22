const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

async function listByHotel(hotelId) {
  const { data, error } = await db()
    .from('reviews')
    .select('id, guest_name, rating, title, comment, stay_label, created_at')
    .eq('hotel_id', hotelId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

module.exports = { listByHotel };
