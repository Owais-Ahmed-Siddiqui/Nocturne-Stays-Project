const { z } = require('zod');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIERS = ['standard', 'deluxe', 'suite'];

// POST /api/bookings
const createBookingSchema = z
  .object({
    hotelId: z
      .string({ required_error: 'Hotel required', invalid_type_error: 'Hotel required' })
      .trim()
      .min(1, 'Hotel required'),
    roomTier: z
      .string({ required_error: 'Invalid room tier', invalid_type_error: 'Invalid room tier' })
      .trim()
      .refine((v) => TIERS.includes(v), 'Invalid room tier'),
    guestName: z
      .string({ required_error: 'Guest name required', invalid_type_error: 'Guest name required' })
      .trim()
      .min(1, 'Guest name required'),
    guestEmail: z
      .string({ required_error: 'Guest email required', invalid_type_error: 'Guest email required' })
      .trim()
      .toLowerCase()
      .min(1, 'Guest email required')
      .email('Invalid email'),
    phone: z.string().trim().max(30, 'Phone is too long').optional().default(''),
    checkin: z
      .string({ required_error: 'Dates required', invalid_type_error: 'Dates required' })
      .trim()
      .regex(DATE_RE, 'Dates required'),
    checkout: z
      .string({ required_error: 'Dates required', invalid_type_error: 'Dates required' })
      .trim()
      .regex(DATE_RE, 'Dates required'),
    guests: z.coerce
      .number()
      .int('Invalid guests')
      .min(1, 'Guests must be between 1 and 6')
      .max(6, 'Guests must be between 1 and 6')
      .default(1),
    requests: z.string().trim().max(1000, 'Requests are too long').optional().default('')
  })
  .refine((d) => new Date(d.checkout) > new Date(d.checkin), {
    message: 'Check-out must be after check-in',
    path: ['checkout']
  });

// /api/bookings/:code/cancel  and  /api/bookings/:code/history  (params)
const codeParamsSchema = z.object({
  code: z
    .string({ required_error: 'Booking ID required', invalid_type_error: 'Booking ID required' })
    .trim()
    .min(1, 'Booking ID required')
});

module.exports = { createBookingSchema, codeParamsSchema };
