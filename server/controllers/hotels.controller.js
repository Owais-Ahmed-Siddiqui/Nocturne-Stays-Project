const asyncHandler = require('../utils/asyncHandler');
const hotelsService = require('../services/hotels.service');

const list = asyncHandler(async (req, res) => {
  const hotels = await hotelsService.listHotels();
  res.json({ hotels });
});

const reviews = asyncHandler(async (req, res) => {
  const list = await hotelsService.getReviews(String(req.params.id || '').trim());
  res.json({ reviews: list });
});

module.exports = { list, reviews };
