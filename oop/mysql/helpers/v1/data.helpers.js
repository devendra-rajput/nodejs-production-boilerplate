const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * DataHelper - Data Processing Utility Class
 */
class DataHelper {
  /**
   * Validate request body against Joi schema
   */
  async joiValidation(reqBody, schema, _language = 'en') {
    console.log('DataHelper@joiValidation');

    try {
      await Joi.object(schema).validateAsync(reqBody);
      return false;
    } catch (errors) {
      const parsedErrors = [];
      if (errors?.details?.length) {
        errors.details.forEach((e) => {
          const msg = e.message.replace(/"/g, '');
          parsedErrors.push(msg);
        });
      }

      return parsedErrors.length > 0 ? parsedErrors : false;
    }
  }

  /**
   * Check password strength against regex
   */
  async checkPasswordRegex(password) {
    console.log('DataHelper@passwordRegex');

    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*[@$!%*?&]).{8,}/;
    return passwordRegex.test(password);
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    console.log('DataHelper@hashPassword');

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      throw new Error('Error generating password hash');
    }

    return hashedPassword;
  }

  /**
   * Validate password against hash
   */
  async validatePassword(passwordString, passwordHash) {
    console.log('DataHelper@validatePassword');

    return bcrypt.compare(passwordString, passwordHash);
  }

  /**
   * Generate JWT token
   */
  async generateJWTToken(data) {
    console.log('DataHelper@generateJWTToken');

    const token = jwt.sign(data, process.env.JWT_TOKEN_KEY);
    return token || false;
  }

  /**
   * Generate secure OTP
   */
  async generateSecureOTP(length = 6) {
    console.log('DataHelper@generateSecureOTP');

    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i += 1) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
  }

  /**
   * Validate email format
   */
  async isValidEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Extract page and limit from query params
   */
  async getPageAndLimit(reqQuery) {
    console.log('DataHelper@getPageAndLimit');

    const resObj = {
      page: 1,
      limit: 50,
    };

    if (reqQuery.page) {
      let pageNo = parseInt(reqQuery.page, 10);

      if (typeof pageNo !== 'number' || pageNo < 1) {
        pageNo = 1;
      }

      resObj.page = pageNo;
    }

    if (reqQuery.limit) {
      let limit = parseInt(reqQuery.limit, 10);

      if (typeof limit !== 'number' || limit < 1) {
        limit = 50;
      }

      // Max limit is 100
      if (limit > 100) {
        limit = 100;
      }

      resObj.limit = limit;
    }

    return resObj;
  }

  /**
   * Calculate pagination parameters
   */
  async calculatePagination(totalItems = null, currentPage = null, limit = null) {
    console.log('DataHelper@calculatePagination');

    let page = currentPage || 1;
    let limitVal = limit;

    // Set default limit if not provided
    if (!limitVal) {
      limitVal = totalItems > 50 ? 50 : totalItems;
    }

    let totalPages = Math.ceil(totalItems / limitVal);
    if (totalPages < 1) {
      totalPages = 1;
    }

    // If page number exceeds total pages, set to last page
    if (page > totalPages) {
      page = totalPages;
    }

    const offset = page > 1 ? (page - 1) * limitVal : 0;

    return {
      currentPage: page,
      totalPages,
      offset,
      limit: limitVal,
    };
  }

  /**
   * Convert date to specific timezone and format
   */
  async convertDateTimezoneAndFormat(date, timezone = 'UTC', format = 'YYYY-MM-DDTHH:mm:ssZ') {
    console.log('DataHelper@convertDateTimezoneAndFormat');

    if (!date) return null;

    return moment(date).tz(timezone).format(format);
  }
}

// Export singleton instance
module.exports = new DataHelper();
