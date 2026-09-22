const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

async function listOrderedByPrice() {
  const { data, error } = await db()
    .from('hotels')
    .select('*')
    .order('base_price', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function findById(id) {
  const { data, error } = await db()
    .from('hotels')
    .select('id, name, city, location, base_price, amenity_boost, rating')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ping() {
  const { error } = await db().from('hotels').select('id').limit(1);
  if (error) throw error;
}

module.exports = { listOrderedByPrice, findById, ping };
