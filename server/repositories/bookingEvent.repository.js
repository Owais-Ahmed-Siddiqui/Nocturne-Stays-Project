const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

// Audit events must never break the main booking flow — log and swallow failures.
async function record(event) {
  try {
    const { error } = await db().from('booking_events').insert([{
      booking_code: event.booking_code,
      event_type: event.event_type,
      from_status: event.from_status ?? null,
      to_status: event.to_status,
      actor_role: event.actor_role ?? null,
      actor_email: event.actor_email ?? null,
      note: event.note ?? null
    }]);
    if (error) throw error;
  } catch (err) {
    console.error('Audit log write failed:', err.message || err);
  }
}

async function listByCode(code) {
  const { data, error } = await db()
    .from('booking_events')
    .select('*')
    .eq('booking_code', code)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

module.exports = { record, listByCode };
