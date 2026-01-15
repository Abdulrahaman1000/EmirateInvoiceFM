// ============================================
// FILE: src/middleware/asyncHandler.js
// Async Handler to wrap async route handlers
// ============================================

/**
 * Wraps async route handlers to catch errors and pass to error handler
 * Usage: asyncHandler(async (req, res, next) => { ... })
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;