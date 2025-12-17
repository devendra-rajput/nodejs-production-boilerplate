const { redisClient } = require('../config/v1/redis');

const setKey = async (key, data, expiration = process.env.REDIS_EXPIRATION) => {
  console.log('RedisService@setKey');
  try {
    const hasSaved = await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
    if (!hasSaved) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('RedisService@setKey Error:', error);
    return false;
  }
};

const getAllKeys = async () => {
  console.log('RedisService@getAllKeys');
  try {
    const keys = await redisClient.keys('*');
    if (keys.length < 1) {
      return false;
    }
    return keys;
  } catch (error) {
    console.error('RedisService@getAllKeys Error:', error);
    return false;
  }
};

const getAllSpecificKeys = async (keyPrefix) => {
  console.log('RedisService@getAllSpecificKeys');
  try {
    const keys = await redisClient.keys(`${keyPrefix}*`);
    if (keys.length < 1) {
      return false;
    }
    return keys;
  } catch (error) {
    console.error('RedisService@getAllSpecificKeys Error:', error);
    return false;
  }
};

const getKey = async (key) => {
  console.log('RedisService@getKey');
  try {
    const data = await redisClient.get(key);
    if (!data) {
      return false;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('RedisService@getKey Error:', error);
    return false;
  }
};

const getCount = async () => {
  console.log('RedisService@getCount');
  try {
    const data = await getAllKeys();
    if (!data) {
      return false;
    }
    return data.length;
  } catch (error) {
    console.error('RedisService@getCount Error:', error);
    return false;
  }
};

const clearKey = async (key) => {
  console.log('RedisService@clearKey');
  try {
    const deletedKeyCount = await redisClient.del(key);
    if (deletedKeyCount < 1) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('RedisService@clearKey Error:', error);
    return false;
  }
};

const flushAll = async () => {
  console.log('RedisService@flushAll');
  try {
    const result = await redisClient.flushall();
    if (result !== 'OK') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('RedisService@flushAll Error:', error);
    return false;
  }
};

module.exports = {
  setKey,
  getAllKeys,
  getAllSpecificKeys,
  getKey,
  getCount,
  clearKey,
  flushAll,
};
