/**
 * BaseModel - Abstract Base Class for all Models
 *
 * This class provides common CRUD operations and data access patterns:
 * - Encapsulation: Private methods for internal operations
 * - Abstraction: Common interface for all models
 * - Single Responsibility: Handles data access layer only
 * - Dependency Injection: Accepts schema and cache service
 *
 * @abstract
 */
class BaseModel {
  constructor(schema, cacheService = null, modelName = 'BaseModel') {
    if (new.target === BaseModel) {
      throw new TypeError('Cannot construct BaseModel instances directly');
    }

    this.schema = schema;
    this.cacheService = cacheService;
    this.modelName = modelName;
    this._validateSchema();
  }

  /**
     * Validate that schema is properly injected
     * @private
     */
  _validateSchema() {
    if (!this.schema) {
      throw new Error(`${this.constructor.name} requires a schema to be injected`);
    }
  }

  /**
     * Get the schema instance
     * @protected
     */
  getSchema() {
    return this.schema;
  }

  /**
     * Get cache service
     * @protected
     */
  getCacheService() {
    return this.cacheService;
  }

  /**
     * Generate cache key
     * @protected
     */
  _generateCacheKey(operation, params = {}) {
    const paramsString = Object.entries(params)
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    return `${this.modelName.toLowerCase()}:${operation}:${paramsString}`;
  }

  /**
     * Invalidate cache for this model
     * @protected
     */
  async _invalidateCache(pattern = null) {
    if (!this.cacheService) return;

    try {
      const keyPattern = pattern || `${this.modelName.toLowerCase()}:`;
      const keys = await this.cacheService.getAllSpecificKeys(keyPattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key) => this.cacheService.clearKey(key)));
      }
    } catch (error) {
      console.error(`${this.constructor.name}@_invalidateCache Error:`, error);
    }
  }

  /**
     * Get data from cache or execute query
     * @protected
     */
  async _getCachedOrExecute(cacheKey, queryFn) {
    if (!this.cacheService) {
      return queryFn();
    }

    try {
      const cachedData = await this.cacheService.getKey(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const data = await queryFn();
      if (data) {
        await this.cacheService.setKey(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error(`${this.constructor.name}@_getCachedOrExecute Error:`, error);
      return queryFn();
    }
  }

  /**
     * Create a new document
     * @param {Object} data - Data to create
     * @returns {Promise<Object|boolean>}
     */
  async createOne(data) {
    console.log(`${this.constructor.name}@createOne`);

    try {
      if (!data || data === '') {
        throw new Error('Data is required');
      }

      const document = await this.schema.create(data);
      if (!document) {
        return false;
      }

      // Invalidate cache
      await this._invalidateCache();

      return document;
    } catch (error) {
      console.error(`${this.constructor.name}@createOne Error:`, error);
      return false;
    }
  }

  /**
     * Find one document by column name and value
     * @param {string} columnName - Column name
     * @param {*} columnValue - Column value
     * @returns {Promise<Object|boolean>}
     */
  async getOneByColumnNameAndValue(columnName, columnValue) {
    console.log(`${this.constructor.name}@getOneByColumnNameAndValue`);

    try {
      const result = await this.schema.findOne({
        [columnName]: columnValue,
        deleted_at: { $in: [null, '', ' '] },
      }).collation({ locale: 'en', strength: 2 });

      if (!result) {
        return false;
      }

      return result;
    } catch (error) {
      console.error(`${this.constructor.name}@getOneByColumnNameAndValue Error:`, error);
      return false;
    }
  }

  /**
     * Update one document by ID
     * @param {string} id - Document ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object|boolean>}
     */
  async updateOne(id, data) {
    console.log(`${this.constructor.name}@updateOne`);

    try {
      if ((!id || id === '') || (!data || data === '')) {
        throw new Error('ID and data are required');
      }

      const document = await this.schema.findByIdAndUpdate(id, data, { new: true });
      if (!document) {
        return false;
      }

      // Invalidate cache
      await this._invalidateCache();

      return document;
    } catch (error) {
      console.error(`${this.constructor.name}@updateOne Error:`, error);
      return false;
    }
  }

  /**
     * Delete one document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object|boolean>}
     */
  async deleteOne(id) {
    console.log(`${this.constructor.name}@deleteOne`);

    try {
      const result = await this.schema.deleteOne({ _id: id });
      if (!result) {
        return false;
      }

      // Invalidate cache
      await this._invalidateCache();

      return result;
    } catch (error) {
      console.error(`${this.constructor.name}@deleteOne Error:`, error);
      return false;
    }
  }

  /**
     * Check if document exists
     * @param {string} columnName - Column name
     * @param {*} columnValue - Column value
     * @param {string|boolean} excludeId - ID to exclude from check
     * @returns {Promise<boolean>}
     */
  async exists(columnName, columnValue, excludeId = false) {
    console.log(`${this.constructor.name}@exists`);

    try {
      let query = {
        [columnName]: columnValue,
        deleted_at: { $in: [null, '', ' '] },
      };

      if (excludeId) {
        query = {
          ...query,
          _id: { $ne: excludeId },
        };
      }

      const count = await this.schema.countDocuments(query)
        .collation({ locale: 'en', strength: 2 });

      return count > 0;
    } catch (error) {
      console.error(`${this.constructor.name}@exists Error:`, error);
      return false;
    }
  }
}

module.exports = BaseModel;
