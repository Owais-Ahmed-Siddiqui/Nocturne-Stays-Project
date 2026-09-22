const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const userRepo = require('../repositories/user.repository');

// Field validation lives in validators/auth.validators.js (route middleware).
// This service owns domain rules only: uniqueness, password check, admin role.

async function register({ name, email, password }) {
  try {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError(409, 'Email already registered');

    const hash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ name, email, password_hash: hash, role: 'user' });
    return { user: { id: user.id, name, email, role: 'user' } };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Register failed');
  }
}

async function login({ email, password, asAdmin }) {
  try {
    const u = await userRepo.findByEmail(email);
    // Same message for unknown email and wrong password → prevents account enumeration
    const invalid = new AppError(401, 'Invalid email or password');
    if (!u) throw invalid;

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) throw invalid;

    if (asAdmin && u.role !== 'admin') throw new AppError(403, 'Not an admin account');

    const token = signToken(u);
    return { token, user: { id: u.id, name: u.name, email: u.email, role: u.role } };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Login failed');
  }
}

async function getMe(id) {
  try {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError(401, 'Unauthorized');
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to load session');
  }
}

// Phase 5 — update display name (email/role immutable here)
async function updateProfile(id, name) {
  try {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError(401, 'Unauthorized');

    await userRepo.updateName(id, name);
    return { user: { id: user.id, name, email: user.email, role: user.role } };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to update profile');
  }
}

// Phase 5 — change password (requires current password)
async function changePassword(id, currentPassword, newPassword) {
  try {
    const u = await userRepo.findWithHashById(id);
    if (!u) throw new AppError(401, 'Unauthorized');

    const ok = await bcrypt.compare(currentPassword, u.password_hash);
    if (!ok) throw new AppError(401, 'Wrong current password');

    const hash = await bcrypt.hash(newPassword, 10);
    await userRepo.updatePassword(id, hash);
    return { ok: true };
  } catch (err) {
    if (err.status) throw err;
    console.error(err);
    throw new AppError(500, 'Failed to change password');
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword };
