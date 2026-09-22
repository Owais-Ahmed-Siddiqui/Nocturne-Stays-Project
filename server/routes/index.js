const router = require('express').Router();
const systemController = require('../controllers/system.controller');
const authRoutes = require('./auth.routes');
const hotelsRoutes = require('./hotels.routes');
const bookingsRoutes = require('./bookings.routes');
const adminRoutes = require('./admin.routes');

router.get('/health', systemController.health);
router.use('/auth', authRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
