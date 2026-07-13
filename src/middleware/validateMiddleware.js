const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to run after express-validator checks.
 * Returns all validation errors as a single response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return sendError(res, 422, messages.join(', '), errors.array());
  }
  next();
};

module.exports = { validate };
