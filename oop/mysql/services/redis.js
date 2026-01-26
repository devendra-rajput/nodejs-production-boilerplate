const { BaseService } = require('../core');
const { redisClient } = require('../config/v1/redis');

/**
 * RedisService - Extends BaseService
 */
class RedisService extends BaseService {
  constructor() {
    super('RedisService');
    this.client = redisClient;
  }

  async setKey(key, data, expiration = process.env.REDIS_EXPIRATION) {
    return this._executeWithErrorHandling('setKey', async () => {
      const hasSaved = await this.client.set(key, JSON.stringify(data), 'EX', expiration);
      return !!hasSaved;
    });
  }

  async getAllKeys() {
    return this._executeWithErrorHandling('getAllKeys', async () => {
      const keys = await this.client.keys('*');
      return keys.length > 0 ? keys : false;
    });
  }

  async getAllSpecificKeys(keyPrefix) {
    return this._executeWithErrorHandling('getAllSpecificKeys', async () => {
      const keys = await this.client.keys(`${keyPrefix}*`);
      return keys.length > 0 ? keys : false;
    });
  }

  async getKey(key) {
    return this._executeWithErrorHandling('getKey', async () => {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : false;
    });
  }

  async getCount() {
    return this._executeWithErrorHandling('getCount', async () => {
      const data = await this.getAllKeys();
      return data ? data.length : false;
    });
  }

  async clearKey(key) {
    return this._executeWithErrorHandling('clearKey', async () => {
      const deletedKeyCount = await this.client.del(key);
      return deletedKeyCount > 0;
    });
  }

  async flushAll() {
    return this._executeWithErrorHandling('flushAll', async () => {
      const result = await this.client.flushall();
      return result === 'OK';
    });
  }
}

module.exports = new RedisService();
