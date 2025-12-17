const multer = require('multer');

/** Custom Require * */
const i18n = require('../config/i18n');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  console.log('ErrorMiddleware', err);

  // Normalize error
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = statusCode < 500;

  // Log only server errors (5xx)
  if (!isOperational) {
    logger.error('Unhandled server error: ', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
    });
  }

  // Handle the multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        msg: i18n.__('error.tooManyFilesUploaded'),
        error: i18n.__('error.maxFileLimit', { maxFileCount: req.maxFileCount || 5 }),
      });
    }

    return res.status(400).json({
      msg: i18n.__('error.multerError'),
      error: err.message,
    });
  }

  // Handle the global errors
  const errorMessage = typeof err === 'string' ? err : err.message;
  return res.status(500).json({
    msg: i18n.__('error.serverError'),
    error: errorMessage || i18n.__('error.internalServerError'),
  });
};
