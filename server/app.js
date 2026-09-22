const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Behind the preview/deployment proxy — correct client IPs for rate limiting
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers.
// NOTE: frameguard + frame-ancestors are intentionally disabled so the app can be
// embedded in iframes (live preview). Re-enable `frameguard` in a hardened production
// deployment if you don't need embedding.
app.use(helmet({
  frameguard: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    usePreset: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      // 'unsafe-inline' + 'unsafe-eval' + jsdelivr: required by the Tailwind browser CDN (design unchanged)
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      // Overrides helmet's default frame-ancestors 'self' so the live preview
      // (cross-origin iframe) is not blocked. Tighten to 'none' when not embedding.
      frameAncestors: ['*']
    }
  }
}));

// Request logging (method, path, status, response time)
app.use(morgan('dev'));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// API — rate limited
app.use('/api', generalLimiter, apiRoutes);

// Frontend (same design, served from /public)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback — any non-API route gets index.html (hash routing handles views)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

// API 404s + central error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
