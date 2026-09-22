const { z } = require('zod');

// GET /api/hotels/:id/reviews
const hotelIdParamsSchema = z.object({
  id: z
    .string({ required_error: 'Hotel required', invalid_type_error: 'Hotel required' })
    .trim()
    .min(1, 'Hotel required')
    .max(50, 'Hotel required')
});

module.exports = { hotelIdParamsSchema };
