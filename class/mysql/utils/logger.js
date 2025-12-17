const winston = require('winston');
require('winston-daily-rotate-file');

const isProd = process.env.NODE_ENV === 'production';

const devFormat = winston.format.combine(
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

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleTransport = new winston.transports.Console();

const fileTransports = [
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

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd ? prodFormat : devFormat,
  defaultMeta: {
    service: process.env.LOG_SERVICE_NAME || 'user-service',
    env: process.env.NODE_ENV || 'development',
    version: process.env.API_VER || '1.0.0',
  },
  transports: [
    consoleTransport,
    ...fileTransports,
  ],
  exitOnError: false,
});

module.exports = logger;
