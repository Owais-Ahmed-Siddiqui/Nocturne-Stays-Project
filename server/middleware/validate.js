// Zod validation middleware — parses req[source], rejects with a friendly 400.
const AppError = require('../utils/AppError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const first = result.error.issues?.[0];
        return next(new AppError(400, first?.message || 'Invalid request'));
      }
      if (source === 'body') {
        req.body = result.data;
      } else {
        // params/query may be getter-backed (re-parsed) — define an own property
        // so the parsed/ defaulted value is what handlers read.
        Object.defineProperty(req, source, {
          value: result.data,
          writable: true,
          configurable: true
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
