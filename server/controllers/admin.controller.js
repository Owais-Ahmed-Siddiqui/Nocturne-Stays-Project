const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

const listBookings = asyncHandler(async (req, res) => {
  // query is validated/ defaulted by validate(adminQuerySchema, 'query') in routes
  const result = await adminService.listBookings(req.query);
  res.json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim();
  const status = String(req.body.status || '').trim();
  if (!['approved', 'declined', 'pending'].includes(status)) {
    throw new AppError(400, 'Invalid status');
  }
  // actor → recorded in the booking_events audit trail
  const result = await adminService.updateStatus(code, status, {
    id: req.auth.id,
    role: req.auth.role
  });
  res.json(result);
});

const exportData = asyncHandler(async (req, res) => {
  const data = await adminService.exportData();
  res.json(data);
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers();
  res.json(result);
});

const clearData = asyncHandler(async (req, res) => {
  const result = await adminService.clearData();
  res.json(result);
});

module.exports = { listBookings, listUsers, updateStatus, exportData, clearData };
