const AppError = require('../utils/AppError');
const { bookingRowToDTO } = require('../utils/helpers');
const userRepo = require('../repositories/user.repository');
const bookingRepo = require('../repositories/booking.repository');
const bookingEventRepo = require('../repositories/bookingEvent.repository');

// Phase 4 — paginated + filtered list with dashboard stats.
// query: { page, pageSize, status, q, from, to } (already validated)
function buildStats(statuses) {
  const stats = { total: statuses.length, pending: 0, approved: 0, declined: 0, cancelled: 0 };
  for (const s of statuses) {
    if (s && s !== 'total' && s in stats) stats[s] += 1;
  }
  return stats;
}

async function listBookings(query = {}) {
  try {
    const normalized = {
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      status: query.status || 'all',
      q: query.q || '',
      from: query.from || '',
      to: query.to || ''
    };

    const [listResult, statuses] = await Promise.all([
      bookingRepo.listFiltered(normalized),
      bookingRepo.listAllStatuses()
    ]);

    const total = listResult.total;
    const pages = Math.max(1, Math.ceil(total / normalized.pageSize));

    return {
      bookings: listResult.rows.map(bookingRowToDTO),
      total,
      page: normalized.page,
      pageSize: normalized.pageSize,
      pages,
      stats: buildStats(statuses)
    };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load admin bookings');
  }
}

// actor = { id, role } of the admin making the change (for the audit trail)
async function updateStatus(code, status, actor = {}) {
  try {
    const existing = await bookingRepo.findByCode(code);
    if (!existing) throw new AppError(404, 'Booking not found');

    const rows = await bookingRepo.updateStatus(code, status);
    if (!rows.length) throw new AppError(404, 'Booking not found');

    // Audit trail (best-effort — never fails the status change)
    let actorEmail = '';
    if (actor.id) {
      try {
        const u = await userRepo.findById(actor.id);
        actorEmail = u?.email || '';
      } catch { /* best-effort */ }
    }
    await bookingEventRepo.record({
      booking_code: code,
      event_type: 'status_change',
      from_status: existing.status,
      to_status: status,
      actor_role: actor.role || 'admin',
      actor_email: actorEmail,
      note: `Marked as ${status}`
    });

    return { ok: true };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to update booking');
  }
}

// Phase 5 — users directory with per-user booking counts
async function listUsers() {
  try {
    const [users, ownerRows] = await Promise.all([
      userRepo.listAll(),
      bookingRepo.listOwnerStats()
    ]);

    const counts = {};
    for (const b of ownerRows) {
      const k = b.user_id;
      if (!counts[k]) counts[k] = { total: 0, pending: 0 };
      counts[k].total += 1;
      if (b.status === 'pending') counts[k].pending += 1;
    }

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        bookings: counts[u.id]?.total || 0,
        pending: counts[u.id]?.pending || 0
      }))
    };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load users');
  }
}

async function exportData() {
  try {
    const [users, bookings] = await Promise.all([userRepo.listAll(), bookingRepo.listRaw()]);
    return { users, bookings };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Export failed');
  }
}

async function clearData() {
  try {
    await bookingRepo.deleteAll();
    await userRepo.deleteNonAdmins();
    return { ok: true };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Clear failed');
  }
}

module.exports = { listBookings, listUsers, updateStatus, exportData, clearData };
