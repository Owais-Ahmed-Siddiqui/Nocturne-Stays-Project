const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { statusParamsSchema, statusBodySchema, adminQuerySchema } = require('../validators/admin.validators');

router.use(requireAuth, requireAdmin);

router.get('/bookings', validate(adminQuerySchema, 'query'), adminController.listBookings);
router.get('/users', adminController.listUsers);
router.put(
  '/bookings/:code/status',
  validate(statusParamsSchema, 'params'),
  validate(statusBodySchema),
  adminController.updateStatus
);
router.get('/export', adminController.exportData);
router.delete('/clear', adminController.clearData);

module.exports = router;
