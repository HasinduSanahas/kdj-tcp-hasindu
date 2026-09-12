// src/middleware/errorHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// Global Express Error Handler
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

function errorHandler(err, req, res, next) {
  console.error('[Server] Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error:   err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
