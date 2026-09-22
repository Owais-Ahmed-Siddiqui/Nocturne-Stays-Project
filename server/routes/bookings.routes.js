const router = require('express').Router();
const bookingsController = require('../controllers/bookings.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBookingSchema, codeParamsSchema } = require('../validators/booking.validators');

router.post(
  '/',
  requireAuth,
  requireRole('user', 'Only users can create bookings'),
  validate(createBookingSchema),
  bookingsController.create
);

router.get(
  '/mine',
  requireAuth,
  requireRole('user', 'Only users can view this list'),
  bookingsController.mine
);

// Phase 3 — cancel + history (owner or admin; checked in service)
router.post(
  '/:code/cancel',
  requireAuth,
  requireRole('user', 'Only users can cancel bookings'),
  validate(codeParamsSchema, 'params'),
  bookingsController.cancel
);

router.get(
  '/:code/history',
  requireAuth,
  validate(codeParamsSchema, 'params'),
  bookingsController.history
);

module.exports = router;
