const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('../config/v1/redis');
const logger = require('../utils/logger');

let rateLimiter;

const initRateLimiter = () => {
  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1, // per 1 second by IP
  });
};

const rateLimiterMiddleware = (req, res, next) => {
  if (!rateLimiter) {
    initRateLimiter();
  }

  // console.log(`RateLimiter: Consuming point for IP ${req.ip}`);
  rateLimiter.consume(req.ip)
    .then((_rateLimiterRes) => {
      // console.log('RateLimiter: Allowed', rateLimiterRes);
      next();
    })
    .catch((err) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        retryAfter: err?.msBeforeNext,
      });

      console.error('RateLimiter: Rejected or Error', err);
      res.status(429).send('Too Many Requests');
    });
};

module.exports = {
  rateLimiterMiddleware,
  initRateLimiter,
};
