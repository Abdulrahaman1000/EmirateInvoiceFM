

// ============================================
// FILE: src/middleware/asyncHandler.js
// Async Error Handler Wrapper
// ============================================

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;