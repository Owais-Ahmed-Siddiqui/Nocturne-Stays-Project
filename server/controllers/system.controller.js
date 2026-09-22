const asyncHandler = require('../utils/asyncHandler');
const hotelsService = require('../services/hotels.service');

const health = asyncHandler(async (req, res) => {
  const result = await hotelsService.health();
  res.json(result);
});

module.exports = { health };
