const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return next(new AppError(401, 'Unauthorized'));
  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    return next(new AppError(401, 'Invalid token'));
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') return next(new AppError(403, 'Admin only'));
  next();
}

function requireRole(role, message) {
  return (req, res, next) => {
    if (req.auth?.role !== role) return next(new AppError(403, message || 'Forbidden'));
    next();
  };
}

module.exports = { requireAuth, requireAdmin, requireRole };
