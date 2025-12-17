const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// custom require
const setupRoutes = require('./routes');

const swaggerSpecs = require('../config/swagger');
const i18n = require('../config/i18n');
const corsConfig = require('../config/cors');
const { connectDB } = require('../config/v1/mongodb');

const { rateLimiterMiddleware } = require('../middleware/rateLimiter');
const error = require('../middleware/error');
const timezone = require('../middleware/timezone');

const logger = require('../utils/logger');
const envValidator = require('../utils/envValidator');

module.exports = async (app) => {
  console.log('Loading startup files!');

  // Validate env variables
  envValidator();

  // Establish Database Connection First
  await connectDB();

  // Middleware to parse URL-encoded form data
  app.use(express.urlencoded({ extended: true }));

  // parse application/json
  app.use(express.json({ limit: '50mb' }));

  // Enable Cross-Origin Resource Sharing (CORS)
  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-to-server or curl
        if (!origin) return callback(null, true);

        if (corsConfig.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        logger.error('Blocked by CORS', { origin });
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: corsConfig.credentials,
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      exposedHeaders: corsConfig.exposedHeaders,
      maxAge: corsConfig.maxAge,
    }),
  );

  // Secure HTTP headers: Content-Security-Policy, X-Frame-Options, etc.
  app.use(helmet());

  // Initialize i18n middleware
  app.use(i18n.init);

  // Used the middlewares
  app.use(timezone);
  app.use(rateLimiterMiddleware);

  /**
   * Only trust proxy headers if the TCP connection comes from localhost.
   * Any external IP proxy will not be allowed
   */
  app.set('trust proxy', 'loopback');

  // Define the swagger documentaion route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

  // Request logging
  // Disable all console logs if LOG_DISABLE is true
  if (process.env.LOG_DISABLE === 'false') {
    app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        timezone: req.timezone,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  // Define the static file path
  app.use('/public', express.static('public'));
  app.use('/uploads', express.static('uploads'));

  // Set up ejs template engine to render html
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../', 'views'));

  // Route setup (awaited)
  await setupRoutes(app);

  // Error middleware
  app.use(error);
};
