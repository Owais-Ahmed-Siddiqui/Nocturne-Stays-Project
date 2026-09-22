const router = require('express').Router();
const hotelsController = require('../controllers/hotels.controller');
const { validate } = require('../middleware/validate');
const { hotelIdParamsSchema } = require('../validators/hotel.validators');

router.get('/', hotelsController.list);
router.get('/:id/reviews', validate(hotelIdParamsSchema, 'params'), hotelsController.reviews);

module.exports = router;
