const multer = require('multer');
const i18n = require('../config/i18n');
const { logger } = require('../utils/logger');

/**
 * ErrorHandler - Global Error Handling Middleware
 * Handles all application errors with proper logging and responses
 */
class ErrorHandler {
  /**
   * Check if error is operational (client error)
   */
  _isOperationalError(statusCode) {
    return statusCode < 500;
  }

  /**
  * Log server errors (5xx)
  */
  _logServerError(err, req) {
    logger.error('Unhandled server error:', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
    });
  }

  /**
  * Handle Multer errors
  */
  _handleMulterError(err, req, res) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        statusCode: 400,
        message: i18n.__('error.tooManyFilesUploaded'),
        error: i18n.__('error.maxFileLimit', { maxFileCount: req.maxFileCount || 5 }),
      });
    }

    return res.status(400).json({
      statusCode: 400,
      message: i18n.__('error.multerError'),
      error: err.message,
    });
  }

  /**
  * Handle global errors
  */
  _handleGlobalError(err, res) {
    const errorMessage = typeof err === 'string' ? err : err.message;

    return res.status(500).json({
      statusCode: 500,
      message: i18n.__('error.serverError'),
      error: errorMessage || i18n.__('error.internalServerError'),
    });
  }

  /**
   * Main error handling middleware
   */
  handle(err, req, res, _next) {
    console.log('ErrorHandler:', err.message || err);

    // Normalize error
    const statusCode = err.statusCode || err.status || 500;
    const isOperational = this._isOperationalError(statusCode);

    // Log only server errors (5xx)
    if (!isOperational) {
      this._logServerError(err, req);
    }

    // Handle Multer errors
    if (err instanceof multer.MulterError) {
      return this._handleMulterError(err, req, res);
    }

    // Handle global errors
    return this._handleGlobalError(err, res);
  }

  /**
   * Get middleware function
   */
  middleware() {
    return (err, req, res, next) => this.handle(err, req, res, next);
  }
}

// Export middleware function
module.exports = new ErrorHandler().middleware();
