// Operational error with an HTTP status whose message is safe to show clients.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
    this.name = 'AppError';
  }
}

module.exports = AppError;
