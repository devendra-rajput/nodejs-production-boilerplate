const { Op } = require('sequelize');

/** Custom Require * */
const dataHelper = require('../../../helpers/v1/data.helpers');
const User = require('./user.model');
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
 *         - first_name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         first_name:
 *           type: string
 *           description: The first name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: The role of the user
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The users managing API
 */

const createOne = async (data) => {
  console.log('UsersResources@createOne');

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
    console.log('Error UsersResources@createOne: ', error);
    return false;
  }
};

const getOneByColumnNameAndValue = async (columnName, columnValue) => {
  console.log('UsersResources@getOneByColumnNameAndValue');

  try {
    const result = await User.findOne({
      where: {
        [columnName]: columnValue,
        deleted_at: null,
      },
      raw: true,
    });

    if (!result) {
      return false;
    }

    return result;
  } catch (error) {
    console.log('Error UsersResources@getOneByColumnNameAndValue: ', error);
    return false;
  }
};

const getOneByPhoneCodeAndNumber = async (phoneCode, phoneNumber) => {
  console.log('UsersResources@getOneByPhoneCodeAndNumber');

  try {
    const result = await User.findOne({
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
    console.log('Error UsersResources@getOneByPhoneCodeAndNumber: ', error);
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
      deleted_at: null,
    };

    if (filterObj?.role) {
      dbQuery = {
        ...dbQuery,
        role: filterObj.role,
      };
    }

    const totalRecords = await User.count({
      where: dbQuery,
    });

    const pagination = await dataHelper.calculatePagination(totalRecords, page, limit);

    const users = await User.findAll({
      attributes: {
        exclude: ['password', 'auth_token', 'fcm_token'],
      },
      where: dbQuery,
      order: [['created_at', 'desc']],
      raw: true,
    });

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
    console.log('Error UsersResources@getAllWithPagination: ', error);
    return false;
  }
};

const isUserExist = async (columnName, columnValue, userId = false) => {
  console.log('UsersResources@isUserExist');

  try {
    let query = {
      [columnName]: columnValue,
      deleted_at: null,
    };

    if (userId) {
      query = {
        ...query,
        id: {
          [Op.ne]: userId,
        },
      };
    }

    const usersCount = await User.count({
      where: query,
    });

    if (!usersCount || usersCount <= 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.log('Error UsersResources@isUserExist: ', error);
    return false;
  }
};

const updateOne = async (id, data) => {
  console.log('UsersResources@updateOne');

  try {
    if ((!id || id === '') || (!data || data === '')) {
      throw new Error('data is required');
    }

    const hasUpdated = await User.update(data, {
      where: {
        id,
      },
    });

    if (!hasUpdated) {
      return false;
    }

    const updatedUser = await User.findOne({
      where: { id },
      raw: true,
    });

    // Invalidate cache
    const keys = await redis.getAllSpecificKeys('users:list:');
    if (keys) {
      await Promise.all(keys.map((key) => redis.clearKey(key)));
    }

    return updatedUser;
  } catch (error) {
    console.log('Error UsersResources@updateOne: ', error);
    return false;
  }
};

const getFormattedData = async (userObj = null) => {
  console.log('UsersResources@getFormattedData');

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
    created_at: dataHelper.convertDateTimezoneAndFormat(userObj.created_at),
    updated_at: dataHelper.convertDateTimezoneAndFormat(userObj.updated_at),
    deleted_at: userObj.deleted_at,
  };

  return result;
};

const deleteOne = async (id) => {
  console.log('UsersResources@deleteOne');

  try {
    const hasDeleted = await User.destroy({
      where: {
        id,
      },
    });

    if (!hasDeleted) {
      return false;
    }

    // Invalidate cache
    const keys = await redis.getAllSpecificKeys('users:list:');
    if (keys) {
      await Promise.all(keys.map((key) => redis.clearKey(key)));
    }

    return hasDeleted;
  } catch (error) {
    console.log('Error UsersResources@deleteOne: ', error);
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
