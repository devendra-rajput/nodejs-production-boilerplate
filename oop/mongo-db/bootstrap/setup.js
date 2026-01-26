const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const expressLayouts = require('express-ejs-layouts');

const setupRoutes = require('./routes');
const swaggerSpecs = require('../config/swagger');
const i18n = require('../config/i18n');
const corsConfig = require('../config/cors');
const { connectDB } = require('../config/v1/mongodb');
const { connectRedis } = require('../config/v1/redis');
const { rateLimiterMiddleware } = require('../middleware/rateLimiter');
const errorMiddleware = require('../middleware/error');
const timezone = require('../middleware/timezone');
const { logger } = require('../utils/logger');
const envValidator = require('../utils/envValidator');

/**
 * ApplicationBootstrap - Application Initialization Service
 * Handles all application startup configuration
 */
class ApplicationBootstrap {
  constructor(app) {
    this.app = app;
  }

  /**
  * Validate environment variables
  */
  _validateEnvironment() {
    console.log('📋 Validating environment variables...');
    envValidator.validate(true);
    console.log('✅ Environment validation passed');
  }

  /**
  * Connect to database
  */
  async _connectDatabase() {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    console.log('📦 Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected\n');
  }

  /**
  * Setup body parsers
  */
  _setupBodyParsers() {
    console.log('📦 Setting up body parsers...');
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json({ limit: '50mb' }));
  }

  /**
  * Setup CORS configuration
  */
  _setupCORS() {
    console.log('🌐 Setting up CORS...');
    this.app.use(
      cors({
        origin: (origin, callback) => {
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
  }

  /**
  * Setup security headers
  */
  _setupSecurity() {
    console.log('🔒 Setting up security headers...');
    this.app.use(helmet());
    this.app.set('trust proxy', 'loopback');
  }

  /**
  * Setup internationalization
  */
  _setupI18n() {
    console.log('🌍 Setting up i18n...');
    this.app.use(i18n.init);
  }

  /**
  * Setup middleware
  */
  _setupMiddleware() {
    console.log('⚙️  Setting up middleware...');
    this.app.use(timezone);
    this.app.use(rateLimiterMiddleware);
  }

  /**
  * Setup request logging
  */
  _setupRequestLogging() {
    if (process.env.LOG_DISABLE === 'false') {
      console.log('📝 Setting up request logging...');
      this.app.use((req, res, next) => {
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
  }

  /**
  * Setup static file serving
  */
  _setupStaticFiles() {
    console.log('📁 Setting up static file serving...');
    this.app.use('/public', express.static('public'));
    this.app.use('/uploads', express.static('uploads'));
  }

  /**
  * Setup view engine (EJS)
  */
  _setupViewEngine() {
    console.log('🎨 Setting up view engine...');
    this.app.set('view engine', 'ejs');
    this.app.use(expressLayouts);
    this.app.set('layout', 'layout');
    this.app.set('views', path.join(__dirname, '../', 'views'));
  }

  /**
  * Setup Swagger documentation
  */
  _setupSwagger() {
    console.log('📚 Setting up Swagger documentation...');
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
  }

  /**
  * Setup application routes
  */
  async _setupRoutes() {
    console.log('🛣️  Setting up routes...');
    await setupRoutes(this.app);
    console.log('✅ Routes configured');
  }

  /**
  * Setup error handling middleware
  */
  _setupErrorHandling() {
    console.log('❌ Setting up error handling...');
    this.app.use(errorMiddleware);
  }

  /**
  * Initialize the application
  */
  async initialize() {
    console.log('🚀 Starting application bootstrap...\n');

    try {
      // Step 1: Validate environment
      this._validateEnvironment();

      // Step 2: Connect to database
      await this._connectDatabase();

      // Step 3: Setup body parsers
      this._setupBodyParsers();

      // Step 4: Setup CORS
      this._setupCORS();

      // Step 5: Setup security
      this._setupSecurity();

      // Step 6: Setup i18n
      this._setupI18n();

      // Step 7: Setup middleware
      this._setupMiddleware();

      // Step 8: Setup request logging
      this._setupRequestLogging();

      // Step 9: Setup static files
      this._setupStaticFiles();

      // Step 10: Setup view engine
      this._setupViewEngine();

      // Step 11: Setup Swagger
      this._setupSwagger();

      // Step 12: Setup routes
      await this._setupRoutes();

      // Step 13: Setup error handling (must be last)
      this._setupErrorHandling();

      console.log('\n✅ Application bootstrap completed successfully!\n');
    } catch (error) {
      console.error('\n❌ Application bootstrap failed:');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }
}

/**
 * Export initialization function for backward compatibility
 */
module.exports = async (app) => {
  const bootstrap = new ApplicationBootstrap(app);
  return bootstrap.initialize();
};
