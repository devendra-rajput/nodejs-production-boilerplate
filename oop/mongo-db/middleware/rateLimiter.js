const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('../config/v1/redis');
const { logger } = require('../utils/logger');

/**
 * RateLimiterMiddleware - Rate Limiting using Redis
 * Protects API from abuse by limiting requests per IP
 */
class RateLimiterMiddleware {
  constructor() {
    this.rateLimiter = null;
    this.config = {
      keyPrefix: 'rate-limiter',
      points: parseInt(process.env.RATE_LIMIT_POINTS, 10) || 200,
      duration: parseInt(process.env.RATE_LIMIT_DURATION, 10) || 1,
      blockDuration: process.env.RATE_LIMIT_BLOCK_DURATION
        ? parseInt(process.env.RATE_LIMIT_BLOCK_DURATION, 10)
        : 10,
    };
  }

  /**
   * Initialize rate limiter
   */
  initialize() {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: this.config.keyPrefix,
      points: this.config.points,
      duration: this.config.duration,
    });

    console.log('RateLimiterMiddleware: Initialized');
  }

  /**
  * Handle rate limit exceeded
  */
  _handleRateLimitExceeded(err, req, res) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      retryAfter: err?.msBeforeNext,
      url: req.originalUrl,
    });

    console.error('RateLimiter: Request rejected', {
      ip: req.ip,
      url: req.originalUrl,
    });

    res.status(429).json({
      statusCode: 429,
      message: 'Too Many Requests',
      retryAfter: Math.ceil((err?.msBeforeNext || 1000) / 1000),
    });
  }

  /**
   * Rate limiter middleware function
   */
  handle(req, res, next) {
    // Initialize if not already done
    if (!this.rateLimiter) {
      this.initialize();
    }

    this.rateLimiter.consume(req.ip)
      .then(() => {
        next();
      })
      .catch((err) => {
        this._handleRateLimitExceeded(err, req, res);
      });
  }

  /**
   * Get middleware function
   */
  middleware() {
    return (req, res, next) => this.handle(req, res, next);
  }

  /**
   * Update configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    if (this.rateLimiter) {
      this.initialize(); // Reinitialize with new config
    }
  }
}

// Export singleton instance
const rateLimiterInstance = new RateLimiterMiddleware();

module.exports = {
  rateLimiterMiddleware: rateLimiterInstance.middleware(),
  initRateLimiter: () => rateLimiterInstance.initialize(),
  setRateLimiterConfig: (config) => rateLimiterInstance.setConfig(config),
};
