const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/auth.validators');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);

// Phase 5 — profile management
router.put('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);
router.put('/password', requireAuth, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
