const asyncHandler = require('../utils/asyncHandler');
const bookingsService = require('../services/bookings.service');

const create = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking(req.auth.id, req.body);
  res.json({ booking });
});

const mine = asyncHandler(async (req, res) => {
  const bookings = await bookingsService.listMine(req.auth.id);
  res.json({ bookings });
});

// Phase 3 — cancel + status history
const cancel = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim();
  const result = await bookingsService.cancelBooking(req.auth.id, req.auth.role, code);
  res.json(result);
});

const history = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim();
  const events = await bookingsService.getHistory(req.auth.id, req.auth.role, code);
  res.json({ events });
});

module.exports = { create, mine, cancel, history };
