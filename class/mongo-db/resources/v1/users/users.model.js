/** Custom Require * */
const { BaseModel } = require('../../../core');
const User = require('./user.schema');
const dataHelper = require('../../../helpers/v1/data.helpers');
const redis = require('../../../services/redis');

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

const USER = 'user';
const ADMIN = 'admin';
const roles = Object.freeze({
  USER,
  ADMIN,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user (hashed, stored securely)
 *         first_name:
 *           type: string
 *           description: The first name of the user
 *         last_name:
 *           type: string
 *           description: The last name of the user
 *         phone_code:
 *           type: string
 *           description: The phone code (e.g., country code)
 *         phone_number:
 *           type: string
 *           description: The phone number of the user
 *         profile_picture:
 *           type: string
 *           description: The URL or path to the user's profile picture
 *         status:
 *           type: string
 *           enum: ['0', '1', '2', '3']
 *           description: >-
 *             The current status of the user
 *             (0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted)
 *         role:
 *           type: string
 *           enum: ['user', 'admin']
 *           description: The role of the user (user or admin)
 *         is_email_verified:
 *           type: boolean
 *           description: Whether the user's email has been verified
 *         deleted_at:
 *           type: string
 *           description: The date and time when the user was deleted (if applicable)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The users managing API
 */

/**
 * UserModel - Extends BaseModel
 *
 * Implements user-specific business logic and data access patterns
 * Demonstrates:
 * - Inheritance: Extends BaseModel
 * - Encapsulation: Uses protected methods from base class
 * - Polymorphism: Overrides base class methods
 */
class UserModel extends BaseModel {
  constructor() {
    // Call parent constructor with schema, cache service, and model name
    super(User, redis, 'User');

    // Set user-specific properties
    this.roles = roles;
    this.statuses = statuses;
  }

  /**
   * Override createOne to use base class implementation
   * Demonstrates polymorphism - using parent's method
   */
  async createOne(data) {
    console.log('UsersModel@createOne');
    // Use parent class method which already handles cache invalidation
    return super.createOne(data);
  }

  /**
   * Override getOneByColumnNameAndValue to use base class implementation
   */
  async getOneByColumnNameAndValue(columnName, columnValue) {
    console.log('UsersModel@getOneByColumnNameAndValue');
    // Use parent class method
    return super.getOneByColumnNameAndValue(columnName, columnValue);
  }

  async getOneByPhoneCodeAndNumber(phoneCode, phoneNumber) {
    console.log('UsersModel@getOneByPhoneCodeAndNumber');

    try {
      const result = await this.schema.findOne({
        phone_code: phoneCode,
        phone_number: phoneNumber,
        deleted_at: {
          $in: [null, '', ' '],
        },
      }).collation({ locale: 'en', strength: 2 });

      if (!result) {
        return false;
      }

      return result;
    } catch (error) {
      console.log('Error UserModel@getOneByPhoneCodeAndNumber: ', error);
      return false;
    }
  }

  /**
   * Check if user exists - uses base class exists method
   */
  async isUserExist(columnName, columnValue, userId = false) {
    console.log('UsersModel@isUserExist');
    // Use parent class exists method
    return super.exists(columnName, columnValue, userId);
  }

  /**
   * Override updateOne to use base class implementation
   */
  async updateOne(id, data) {
    console.log('UsersModel@updateOne');
    // Use parent class method which already handles cache invalidation
    return super.updateOne(id, data);
  }

  /**
   * Format user data for response - implements abstract method from BaseModel
   */
  async getFormattedData(userObj = null) {
    console.log('UsersModel@getFormattedData');

    if (!userObj || userObj === '') {
      throw new Error('userObj is required');
    }

    const result = {
      id: userObj._id,
      first_name: userObj?.user_info?.first_name || null,
      last_name: userObj?.user_info?.last_name || null,
      email: userObj.email,
      role: userObj.role,
      status: userObj.status,
      phone_number: userObj.phone_number,
      phone_code: userObj.phone_code,
      profile_picture: userObj.profile_picture,
      is_email_verified: userObj.is_email_verified,
      created_at: dataHelper.convertDateTimezoneAndFormat(userObj.created_at),
      updated_at: dataHelper.convertDateTimezoneAndFormat(userObj.updated_at),
      deleted_at: userObj.deleted_at,
    };

    return result;
  }

  /**
   * Override deleteOne to use base class implementation
   */
  async deleteOne(id) {
    console.log('UsersModel@deleteOne');
    // Use parent class method which already handles cache invalidation
    return super.deleteOne(id);
  }

  /**
   * Get all users with pagination - implements abstract method from BaseModel
   * Uses cache service from base class
   */
  async getAllWithPagination(page, limit, filterObj = {}) {
    console.log('UsersModel@getAllWithPagination');

    try {
      const cacheKey = this._generateCacheKey('list', { page, limit, role: filterObj?.role || 'all' });

      // Use base class cache method
      return await this._getCachedOrExecute(cacheKey, async () => {
        let dbQuery = {
          deleted_at: {
            $in: [null, '', ' '],
          },
        };

        if (filterObj?.role) {
          dbQuery = {
            ...dbQuery,
            role: filterObj.role,
          };
        }

        const totalRecords = await this.schema.countDocuments(dbQuery);
        const pagination = await dataHelper.calculatePagination(totalRecords, page, limit);

        const users = await this.schema.aggregate([
          { $match: dbQuery },
          {
            $project: {
              password: 0,
              auth_token: 0,
              fcm_token: 0,
            },
          },
        ])
          .sort({ createdAt: -1 })
          .skip(pagination.offset)
          .limit(pagination.limit);

        if (!users) {
          return {
            data: [],
          };
        }

        return {
          data: users,
          pagination: {
            total: totalRecords,
            current_page: pagination.currentPage,
            total_pages: pagination.totalPages,
            per_page: pagination.limit,
          },
        };
      });
    } catch (error) {
      console.log('Error UserModel@getAllWithPagination: ', error);
      return false;
    }
  }
}

module.exports = new UserModel();
