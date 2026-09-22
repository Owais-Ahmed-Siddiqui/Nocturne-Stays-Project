const AppError = require('../utils/AppError');

// Unknown API routes → JSON 404 (keeps SPA fallback out of the API surface).
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Central error handler: AppError messages are client-safe; anything else is logged
// and reported generically.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const isAppError = err instanceof AppError || err.expose === true;
  const message = isAppError
    ? err.message
    : (status >= 500 ? 'Internal server error' : err.message || 'Request failed');

  // Full stack only for unexpected errors; one-line for known operational errors
  if (status >= 500 && isAppError) console.error(`[${status}] ${message}`);
  else if (status >= 500) console.error(err);

  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
