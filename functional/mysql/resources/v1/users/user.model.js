/**
 * User Model - Data Access Layer
 */

const { Op } = require('sequelize');
const { User } = require('../../../models');

// Lazy load dependencies only when needed
// eslint-disable-next-line global-require
const getDataHelper = () => require('../../../helpers/v1/data.helpers');
// eslint-disable-next-line global-require
const getRedisService = () => require('../../../services/redis');

/**
 * User statuses (frozen for immutability)
 */
const USER_STATUS = Object.freeze({
  INACTIVE: '0',
  ACTIVE: '1',
  BLOCKED: '2',
  DELETED: '3',
});

/**
 * User roles (frozen for immutability)
 */
const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

/**
 * Cache key prefixes
 */
const CACHE_KEYS = Object.freeze({
  usersList: 'users:list:',
});

/**
 * Common query conditions
 */
const COMMON_QUERIES = Object.freeze({
  notDeleted: {
    deleted_at: null,
  },
  excludeSensitiveFields: {
    exclude: ['password', 'auth_token', 'fcm_token'],
  },
});

const createNotDeletedQuery = (additionalQuery = {}) => ({
  ...COMMON_QUERIES.notDeleted,
  ...additionalQuery,
});

const generateCacheKey = (prefix, params = {}) => {
  const parts = [prefix];
  Object.entries(params).forEach(([key, value]) => {
    parts.push(`${key}:${value}`);
  });
  return parts.join('');
};

const invalidateUserListCache = async () => {
  const redis = getRedisService();
  const keys = await redis.getAllSpecificKeys(CACHE_KEYS.usersList);

  if (keys && keys.length > 0) {
    await Promise.all(keys.map((key) => redis.clearKey(key)));
  }
};

// Create a new user
const createOne = async (data) => {
  try {
    if (!data) {
      throw new Error('Data is required');
    }

    const user = await User.create(data);
    if (!user) {
      return false;
    }

    // Invalidate cache asynchronously (fire and forget)
    invalidateUserListCache().catch(() => { });

    return user;
  } catch (error) {
    console.error('UserModel@createOne Error:', error.message);
    return false;
  }
};

// Get user by column name and value
const getOneByColumnNameAndValue = async (
  columnName,
  columnValue,
  includeSensitive = false,
) => {
  try {
    const query = {
      where: createNotDeletedQuery({
        [columnName]: columnValue,
      }),
      raw: true,
    };

    // Exclude sensitive fields unless explicitly requested
    if (!includeSensitive) {
      query.attributes = COMMON_QUERIES.excludeSensitiveFields;
    }

    const result = await User.findOne(query);

    if (!result) {
      return false;
    }

    return result;
  } catch (error) {
    console.error('UserModel@getOneByColumnNameAndValue Error:', error.message);
    return false;
  }
};

// Get user by phone code and number
const getOneByPhoneCodeAndNumber = async (phoneCode, phoneNumber) => {
  try {
    const result = await User.findOne({
      attributes: COMMON_QUERIES.excludeSensitiveFields,
      where: createNotDeletedQuery({
        phone_code: phoneCode,
        phone_number: phoneNumber,
      }),
      raw: true,
    });

    if (!result) {
      return false;
    }

    return result;
  } catch (error) {
    console.error('UserModel@getOneByPhoneCodeAndNumber Error:', error.message);
    return false;
  }
};

// Check if user exists
const isUserExist = async (columnName, columnValue, userId = false) => {
  try {
    let query = createNotDeletedQuery({
      [columnName]: columnValue,
    });

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

    return usersCount > 0;
  } catch (error) {
    console.error('UserModel@isUserExist Error:', error.message);
    return false;
  }
};

// Get all users with pagination
const getAllWithPagination = async (page, limit, filterObj = {}) => {
  try {
    const dataHelper = getDataHelper();
    const redis = getRedisService();

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_KEYS.usersList, {
      page,
      limit,
      role: filterObj?.role || 'all',
    });

    // Try to get from cache
    const cachedData = await redis.getKey(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Build query
    let dbQuery = createNotDeletedQuery();

    if (filterObj?.role) {
      dbQuery = {
        ...dbQuery,
        role: filterObj.role,
      };
    }

    // Get total count
    const totalRecords = await User.count({
      where: dbQuery,
    });

    // Calculate pagination
    const pagination = await dataHelper.calculatePagination(
      totalRecords,
      page,
      limit,
    );

    // Get users
    const users = await User.findAll({
      attributes: COMMON_QUERIES.excludeSensitiveFields,
      where: dbQuery,
      order: [['created_at', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset,
      raw: true,
    });

    // Build response object
    const resObj = {
      data: users || [],
      pagination: {
        total: totalRecords,
        current_page: pagination.currentPage,
        total_pages: pagination.totalPages,
        per_page: pagination.limit,
      },
    };

    // Cache the result asynchronously
    redis.setKey(cacheKey, resObj).catch(() => { });

    return resObj;
  } catch (error) {
    console.error('UserModel@getAllWithPagination Error:', error.message);
    return false;
  }
};

// Update user
const updateOne = async (id, data) => {
  try {
    if (!id || !data) {
      throw new Error('ID and data are required');
    }

    const hasUpdated = await User.update(data, {
      where: { id },
    });

    if (!hasUpdated) {
      return false;
    }

    const updatedUser = await User.findOne({
      where: { id },
      raw: true,
    });

    // Invalidate cache asynchronously (fire and forget)
    invalidateUserListCache().catch(() => { });

    return updatedUser;
  } catch (error) {
    console.error('UserModel@updateOne Error:', error.message);
    return false;
  }
};

// Delete user
const deleteOne = async (id) => {
  try {
    const hasDeleted = await User.destroy({
      where: { id },
    });

    if (!hasDeleted) {
      return false;
    }

    // Invalidate cache asynchronously (fire and forget)
    invalidateUserListCache().catch(() => { });

    return true;
  } catch (error) {
    console.error('UserModel@deleteOne Error:', error.message);
    return false;
  }
};

// Format user data for response
const getFormattedData = (userObj) => {
  if (!userObj) {
    throw new Error('userObj is required');
  }

  const dataHelper = getDataHelper();

  return {
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
};

module.exports = {
  createOne,
  getOneByColumnNameAndValue,
  getOneByPhoneCodeAndNumber,
  getAllWithPagination,
  updateOne,
  deleteOne,
  isUserExist,
  getFormattedData,
  USER_STATUS,
  USER_ROLES,
  statuses: USER_STATUS,
  roles: USER_ROLES,
};
