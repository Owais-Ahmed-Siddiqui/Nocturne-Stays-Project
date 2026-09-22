const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.auth.id);
  res.json(result);
});

const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.auth.id, req.body.name);
  res.json(result);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.auth.id, currentPassword, newPassword);
  res.json(result);
});

module.exports = { register, login, me, updateProfile, changePassword };
