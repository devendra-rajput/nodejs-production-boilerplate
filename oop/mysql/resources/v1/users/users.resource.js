const { BaseResource } = require('../../../core');
const User = require('./user.model');
const dataHelper = require('../../../helpers/v1/data.helpers');
const redis = require('../../../services/redis');

// User statuses
const IN_ACTIVE = '0';
const ACTIVE = '1';
const BLOCKED = '2';
const DELETED = '3';
const statuses = Object.freeze({
  IN_ACTIVE,
  ACTIVE,
  BLOCKED,
  DELETED,
});

// User roles
const USER = 'user';
const ADMIN = 'admin';
const roles = Object.freeze({
  USER,
  ADMIN,
});

/**
 * UserResource - Extends BaseResource
 */
class UserResource extends BaseResource {
  constructor() {
    // Inject User model and Redis cache service
    super(User, redis, 'User');

    // Attach constants
    this.roles = roles;
    this.statuses = statuses;
  }

  /**
   * Check if user exists
   */
  async isUserExist(columnName, columnValue, userId = false) {
    console.log(`${this.constructor.name}@isUserExist`);
    return this.exists(columnName, columnValue, userId);
  }

  /**
   * Get one user by phone code and number
   */
  async getOneByPhoneCodeAndNumber(phoneCode, phoneNumber) {
    console.log(`${this.constructor.name}@getOneByPhoneCodeAndNumber`);

    try {
      const result = await this.model.findOne({
        attributes: {
          exclude: ['password', 'auth_token', 'fcm_token'],
        },
        where: {
          phone_code: phoneCode,
          phone_number: phoneNumber,
          deleted_at: null,
        },
        raw: true,
      });

      if (!result) {
        return false;
      }

      return result;
    } catch (error) {
      console.error(`${this.constructor.name}@getOneByPhoneCodeAndNumber Error:`, error);
      return false;
    }
  }

  /**
   * Get all users with pagination
   */
  async getAllWithPagination(page, limit, filterObj = {}) {
    console.log(`${this.constructor.name}@getAllWithPagination`);

    try {
      const cacheKey = this._generateCacheKey('list', {
        page,
        limit,
        role: filterObj?.role || 'all',
      });

      // Try to get from cache
      return await this._getCachedOrExecute(cacheKey, async () => {
        const options = {
          attributes: {
            exclude: ['password', 'auth_token', 'fcm_token'],
          },
        };

        // Use base class method
        return super.getAllWithPagination(page, limit, filterObj, options);
      });
    } catch (error) {
      console.error(`${this.constructor.name}@getAllWithPagination Error:`, error);
      return false;
    }
  }

  /**
   * Format user data for response
   */
  async getFormattedData(userObj = null) {
    console.log(`${this.constructor.name}@getFormattedData`);

    if (!userObj || userObj === '') {
      throw new Error('userObj is required');
    }

    const result = {
      id: userObj.id,
      first_name: userObj?.first_name || null,
      last_name: userObj?.last_name || null,
      email: userObj.email,
      role: userObj.role,
      status: userObj.status,
      phone_number: userObj.phone_number,
      phone_code: userObj.phone_code,
      profile_picture: userObj.profile_picture,
      is_email_verified: userObj.is_email_verified,
      created_at: await dataHelper.convertDateTimezoneAndFormat(userObj.created_at),
      updated_at: await dataHelper.convertDateTimezoneAndFormat(userObj.updated_at),
      deleted_at: userObj.deleted_at,
    };

    return result;
  }
}

// Export singleton instance
module.exports = new UserResource();
