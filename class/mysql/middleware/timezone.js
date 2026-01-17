const moment = require('moment-timezone');

/**
 * TimezoneMiddleware - Request Timezone Handler
 *
 * Extracts and validates timezone from request headers
 * Follows OOP principles:
 * - Encapsulation: Timezone logic in one class
 * - Single Responsibility: Only handles timezone
 */
class TimezoneMiddleware {
  constructor() {
    this.defaultTimezone = 'UTC';
  }

  /**
   * Validate timezone
   * @private
   */
  _isValidTimezone(tz) {
    return moment.tz.zone(tz) !== null;
  }

  /**
   * Extract timezone from request
   * @private
   */
  _extractTimezone(req) {
    return req.headers['x-timezone'] || this.defaultTimezone;
  }

  /**
   * Timezone middleware function
   */
  handle(req, res, next) {
    const tz = this._extractTimezone(req);

    if (this._isValidTimezone(tz)) {
      req.timezone = tz;
    } else {
      req.timezone = this.defaultTimezone;
      console.warn(`TimezoneMiddleware: Invalid timezone '${tz}', using ${this.defaultTimezone}`);
    }

    next();
  }

  /**
   * Get middleware function
   */
  middleware() {
    return (req, res, next) => this.handle(req, res, next);
  }

  /**
   * Set default timezone
   */
  setDefaultTimezone(tz) {
    if (this._isValidTimezone(tz)) {
      this.defaultTimezone = tz;
    }
  }
}

// Export middleware function
module.exports = new TimezoneMiddleware().middleware();
