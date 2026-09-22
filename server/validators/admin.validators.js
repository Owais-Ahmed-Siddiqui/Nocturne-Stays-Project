const { z } = require('zod');

const STATUSES = ['approved', 'declined', 'pending'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// PUT /api/admin/bookings/:code/status  (params + body)
const statusParamsSchema = z.object({
  code: z
    .string({ required_error: 'Booking ID required', invalid_type_error: 'Booking ID required' })
    .trim()
    .min(1, 'Booking ID required')
});

const statusBodySchema = z.object({
  status: z
    .string({ required_error: 'Invalid status', invalid_type_error: 'Invalid status' })
    .trim()
    .refine((v) => STATUSES.includes(v), 'Invalid status')
});

// GET /api/admin/bookings?page=&pageSize=&status=&q=&from=&to=
const adminQuerySchema = z
  .object({
    page: z.coerce
      .number({ invalid_type_error: 'Invalid page' })
      .int('Invalid page')
      .min(1, 'Invalid page')
      .default(1),
    pageSize: z.coerce
      .number({ invalid_type_error: 'Invalid page size' })
      .int('Invalid page size')
      .min(1, 'Invalid page size')
      .max(50, 'Invalid page size')
      .default(10),
    status: z
      .string()
      .trim()
      .default('all')
      .refine((v) => ['all', ...STATUSES, 'cancelled'].includes(v), 'Invalid status'),
    q: z.string().trim().max(100, 'Search is too long').default(''),
    from: z
      .string()
      .trim()
      .refine((v) => v === '' || DATE_RE.test(v), 'Invalid from date')
      .default(''),
    to: z
      .string()
      .trim()
      .refine((v) => v === '' || DATE_RE.test(v), 'Invalid to date')
      .default('')
  })
  .refine((d) => !d.from || !d.to || new Date(d.from) <= new Date(d.to), {
    message: 'From date must be before To date',
    path: ['from']
  });

module.exports = { statusParamsSchema, statusBodySchema, adminQuerySchema };
