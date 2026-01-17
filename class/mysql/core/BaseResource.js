const { Op } = require('sequelize');

/**
 * BaseResource - Abstract Base Class for all Sequelize Models
 *
 * This class provides common CRUD operations and data access patterns for MySQL/Sequelize:
 * - Encapsulation: Private methods for internal operations
 * - Abstraction: Common interface for all models
 * - Single Responsibility: Handles data access layer only
 * - Dependency Injection: Accepts model and cache service
 *
 * @abstract
 */
class BaseResource {
  constructor(model, cacheService = null, resourceName = 'BaseResource') {
    if (new.target === BaseResource) {
      throw new TypeError('Cannot construct BaseResource instances directly');
    }

    this.model = model;
    this.cacheService = cacheService;
    this.resourceName = resourceName;
    this._validateModel();
  }

  /**
   * Validate that model is properly injected
   * @private
   */
  _validateModel() {
    if (!this.model) {
      throw new Error(`${this.constructor.name} requires a model to be injected`);
    }
  }

  /**
   * Get the model instance
   * @protected
   */
  getModel() {
    return this.model;
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
    return `${this.resourceName.toLowerCase()}:${operation}:${paramsString}`;
  }

  /**
   * Invalidate cache for this model
   * @protected
   */
  async _invalidateCache(pattern = null) {
    if (!this.cacheService) return;

    try {
      const keyPattern = pattern || `${this.resourceName.toLowerCase()}:`;
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
   * Create a new record
   * @param {Object} data - Data to create
   * @returns {Promise<Object|boolean>}
   */
  async createOne(data) {
    console.log(`${this.constructor.name}@createOne`);

    try {
      if (!data || data === '') {
        throw new Error('Data is required');
      }

      const record = await this.model.create(data);
      if (!record) {
        return false;
      }

      // Invalidate cache
      await this._invalidateCache();

      return record;
    } catch (error) {
      console.error(`${this.constructor.name}@createOne Error:`, error);
      return false;
    }
  }

  /**
   * Find one record by column name and value
   * @param {string} columnName - Column name
   * @param {*} columnValue - Column value
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<Object|boolean>}
   */
  async getOneByColumnNameAndValue(columnName, columnValue, options = {}) {
    console.log(`${this.constructor.name}@getOneByColumnNameAndValue`);

    try {
      const result = await this.model.findOne({
        where: {
          [columnName]: columnValue,
          deleted_at: null,
        },
        raw: true,
        ...options,
      });

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
   * Update one record by ID
   * @param {number|string} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object|boolean>}
   */
  async updateOne(id, data) {
    console.log(`${this.constructor.name}@updateOne`);

    try {
      if ((!id || id === '') || (!data || data === '')) {
        throw new Error('ID and data are required');
      }

      const [affectedRows] = await this.model.update(data, {
        where: { id },
      });

      if (!affectedRows) {
        return false;
      }

      const updatedRecord = await this.model.findOne({
        where: { id },
        raw: true,
      });

      // Invalidate cache
      await this._invalidateCache();

      return updatedRecord;
    } catch (error) {
      console.error(`${this.constructor.name}@updateOne Error:`, error);
      return false;
    }
  }

  /**
   * Delete one record by ID (hard delete)
   * @param {number|string} id - Record ID
   * @returns {Promise<number|boolean>}
   */
  async deleteOne(id) {
    console.log(`${this.constructor.name}@deleteOne`);

    try {
      const result = await this.model.destroy({
        where: { id },
      });

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
   * Soft delete one record by ID
   * @param {number|string} id - Record ID
   * @returns {Promise<Object|boolean>}
   */
  async softDeleteOne(id) {
    console.log(`${this.constructor.name}@softDeleteOne`);

    try {
      const data = {
        deleted_at: new Date().toISOString().replace('Z', '+00:00'),
      };

      return this.updateOne(id, data);
    } catch (error) {
      console.error(`${this.constructor.name}@softDeleteOne Error:`, error);
      return false;
    }
  }

  /**
   * Check if record exists
   * @param {string} columnName - Column name
   * @param {*} columnValue - Column value
   * @param {number|string|boolean} excludeId - ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async exists(columnName, columnValue, excludeId = false) {
    console.log(`${this.constructor.name}@exists`);

    try {
      let query = {
        [columnName]: columnValue,
        deleted_at: null,
      };

      if (excludeId) {
        query = {
          ...query,
          id: {
            [Op.ne]: excludeId,
          },
        };
      }

      const count = await this.model.count({
        where: query,
      });

      return count > 0;
    } catch (error) {
      console.error(`${this.constructor.name}@exists Error:`, error);
      return false;
    }
  }

  /**
   * Get all records with pagination
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @param {Object} filterObj - Filter conditions
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<Object|boolean>}
   */
  async getAllWithPagination(page, limit, filterObj = {}, options = {}) {
    console.log(`${this.constructor.name}@getAllWithPagination`);

    try {
      const where = {
        deleted_at: null,
        ...filterObj,
      };

      const totalRecords = await this.model.count({ where });

      // Calculate offset
      const offset = (page - 1) * limit;

      const records = await this.model.findAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        raw: true,
        ...options,
      });

      const totalPages = Math.ceil(totalRecords / limit);

      return {
        data: records || [],
        pagination: {
          total: totalRecords,
          current_page: page,
          total_pages: totalPages,
          per_page: limit,
        },
      };
    } catch (error) {
      console.error(`${this.constructor.name}@getAllWithPagination Error:`, error);
      return false;
    }
  }

  /**
   * Get all records
   * @param {Object} filterObj - Filter conditions
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<Array|boolean>}
   */
  async getAll(filterObj = {}, options = {}) {
    console.log(`${this.constructor.name}@getAll`);

    try {
      const where = {
        deleted_at: null,
        ...filterObj,
      };

      const records = await this.model.findAll({
        where,
        raw: true,
        ...options,
      });

      return records || [];
    } catch (error) {
      console.error(`${this.constructor.name}@getAll Error:`, error);
      return false;
    }
  }

  /**
   * Count records
   * @param {Object} filterObj - Filter conditions
   * @returns {Promise<number>}
   */
  async count(filterObj = {}) {
    console.log(`${this.constructor.name}@count`);

    try {
      const where = {
        deleted_at: null,
        ...filterObj,
      };

      return await this.model.count({ where });
    } catch (error) {
      console.error(`${this.constructor.name}@count Error:`, error);
      return 0;
    }
  }
}

module.exports = BaseResource;
