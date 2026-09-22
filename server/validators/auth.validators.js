const { z } = require('zod');

// POST /api/auth/register
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name required', invalid_type_error: 'Name required' })
    .trim()
    .min(1, 'Name required'),
  email: z
    .string({ required_error: 'Email required', invalid_type_error: 'Email required' })
    .trim()
    .toLowerCase()
    .min(1, 'Email required')
    .email('Invalid email'),
  password: z
    .string({
      required_error: 'Password must be at least 8 characters',
      invalid_type_error: 'Password must be at least 8 characters'
    })
    .min(8, 'Password must be at least 8 characters')
});

// POST /api/auth/login
const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().default(''),
    password: z.string().default(''),
    asAdmin: z.boolean().optional().default(false)
  })
  .refine((d) => d.email.length > 0 && d.password.length > 0, {
    message: 'Email and password required'
  });

// Phase 5 — profile + password change
const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Name required', invalid_type_error: 'Name required' })
    .trim()
    .min(1, 'Name required')
    .max(120, 'Name is too long')
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password required', invalid_type_error: 'Current password required' })
    .min(1, 'Current password required'),
  newPassword: z
    .string({
      required_error: 'Password must be at least 8 characters',
      invalid_type_error: 'Password must be at least 8 characters'
    })
    .min(8, 'Password must be at least 8 characters')
});

module.exports = { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema };
