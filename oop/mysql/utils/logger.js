const winston = require('winston');
require('winston-daily-rotate-file');

/**
 * LoggerUtils - Winston Logger Configuration
 */
class LoggerUtils {
  constructor() {
    this.isProd = process.env.NODE_ENV === 'production';
    this.logger = this._createLogger();
  }

  /**
   * Create development log format
   */
  _createDevFormat() {
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({
        timestamp, level, message, ...meta
      }) => {
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta, null, 2)
          : '';
        return `${timestamp} ${level}: ${message} ${metaStr}`;
      }),
    );
  }

  /**
   * Create production log format
   */
  _createProdFormat() {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );
  }

  /**
   * Create console transport
   */
  _createConsoleTransport() {
    return new winston.transports.Console();
  }

  /**
   * Create file transports
   */
  _createFileTransports() {
    return [
      new winston.transports.DailyRotateFile({
        filename: 'logs/error/error-%DATE%.log',
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/combined/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      }),
    ];
  }

  /**
   * Create logger instance
   */
  _createLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: this.isProd ? this._createProdFormat() : this._createDevFormat(),
      defaultMeta: {
        service: process.env.LOG_SERVICE_NAME || 'user-service',
        env: process.env.NODE_ENV || 'development',
        version: process.env.API_VER || '1.0.0',
      },
      transports: [
        this._createConsoleTransport(),
        ...this._createFileTransports(),
      ],
      exitOnError: false,
    });
  }

  /**
   * Get logger instance
   */
  getLogger() {
    return this.logger;
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

// Export singleton instance's logger
const loggerUtils = new LoggerUtils();
module.exports = {
  logger: loggerUtils.getLogger(),
};
