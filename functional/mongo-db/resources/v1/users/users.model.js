/** Custom Require * */
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
 *           description: >
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

const createOne = async (data) => {
  console.log('UsersModel@createOne');

  try {
    if (!data || data === '') {
      throw new Error('Data is required');
    }

    // Insert the user data
    const user = await User.create(data);
    if (!user) {
      return false;
    }

    // Invalidate cache
    const keys = await redis.getAllSpecificKeys('users:list:');
    if (keys) {
      await Promise.all(keys.map((key) => redis.clearKey(key)));
    }

    return user;
  } catch (error) {
    console.log('Error UserModel@createOne: ', error);
    return false;
  }
};

const getOneByColumnNameAndValue = async (columnName, columnValue) => {
  console.log('UsersModel@getOneByColumnNameAndValue');

  try {
    const result = await User.findOne({
      [columnName]: columnValue,
      deleted_at: {
        $in: [null, '', ' '],
      }, // Check for null, empty string, or space
    })
      .collation({ locale: 'en', strength: 2 });
    if (!result) {
      return false;
    }

    return result;
  } catch (error) {
    console.log('Error UserModel@getOneByColumnNameAndValue: ', error);
    return false;
  }
};

const getOneByPhoneCodeAndNumber = async (phoneCode, phoneNumber) => {
  console.log('UsersModel@getOneByPhoneCodeAndNumber');

  try {
    const result = await User.findOne({
      phone_code: phoneCode,
      phone_number: phoneNumber,
      deleted_at: {
        $in: [null, '', ' '],
      }, // Check for null, empty string, or space
    })
      .collation({ locale: 'en', strength: 2 });
    if (!result) {
      return false;
    }

    return result;
  } catch (error) {
    console.log('Error UserModel@getOneByPhoneCodeAndNumber: ', error);
    return false;
  }
};

const isUserExist = async (columnName, columnValue, userId = false) => {
  console.log('UsersModel@isUserExist');

  try {
    let query = {
      [columnName]: columnValue,
      deleted_at: {
        $in: [null, '', ' '],
      }, // Check for null, empty string, or space
    };

    if (userId) {
      query = {
        ...query,
        _id: {
          $ne: userId,
        },
      };
    }
    const usersCount = await User.countDocuments(query).collation({ locale: 'en', strength: 2 });
    if (!usersCount || usersCount <= 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.log('Error UserModel@isUserExist: ', error);
    return false;
  }
};

const updateOne = async (id, data) => {
  console.log('UsersModel@updateOne');

  try {
    if ((!id || id === '') || (!data || data === '')) {
      throw new Error('data is required');
    }

    const user = await User.findByIdAndUpdate(id, data, { new: true });
    if (!user) {
      return false;
    }

    // Invalidate cache
    const keys = await redis.getAllSpecificKeys('users:list:');
    if (keys) {
      await Promise.all(keys.map((key) => redis.clearKey(key)));
    }

    return user;
  } catch (error) {
    console.log('Error UserModel@updateOne: ', error);
    return false;
  }
};

const getFormattedData = async (userObj = null) => {
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
};

const deleteOne = async (id) => {
  console.log('UsersModel@deleteOne');

  try {
    const result = await User.deleteOne({ _id: id });
    if (!result) {
      return false;
    }

    // Invalidate cache
    const keys = await redis.getAllSpecificKeys('users:list:');
    if (keys) {
      await Promise.all(keys.map((key) => redis.clearKey(key)));
    }

    return result;
  } catch (error) {
    console.log('Error UserModel@deleteOne: ', error);
    return false;
  }
};

const getAllWithPagination = async (page, limit, filterObj = {}) => {
  console.log('UsersResources@getAllWithPagination');

  try {
    const cacheKey = `users:list:page:${page}:limit:${limit}:role:${filterObj?.role || 'all'}`;
    const cachedData = await redis.getKey(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    let resObj;
    let dbQuery = {
      deleted_at: {
        $in: [null, '', ' '],
      }, // Check for null, empty string, or space
    };

    if (filterObj?.role) {
      dbQuery = {
        ...dbQuery,
        role: filterObj.role,
      };
    }

    const totalRecords = await User.countDocuments(dbQuery);

    const pagination = await dataHelper.calculatePagination(totalRecords, page, limit);

    const users = await User.aggregate([
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
      resObj = {
        data: [],
      };
    } else {
      resObj = {
        data: users,
        pagination: {
          total: totalRecords,
          current_page: pagination.currentPage,
          total_pages: pagination.totalPages,
          per_page: pagination.limit,
        },
      };
    }

    // Cache the result
    await redis.setKey(cacheKey, resObj);

    return resObj;
  } catch (error) {
    console.log('Error UserModel@getAllWithPagination: ', error);
    return false;
  }
};

module.exports = {
  createOne,
  getOneByColumnNameAndValue,
  getOneByPhoneCodeAndNumber,
  isUserExist,
  updateOne,
  getFormattedData,
  deleteOne,
  getAllWithPagination,
  statuses,
  roles,
};
