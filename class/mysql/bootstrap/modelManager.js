const Sequelize = require('sequelize');
const { sequelize } = require('../config/v1/mysql');
const UserModel = require('../resources/v1/users/user.model');

/**
 * ModelManager - Database Model Management Service
 *
 * Handles model initialization, associations, and database synchronization
 * Follows OOP principles:
 * - Encapsulation: Model management logic in one class
 * - Single Responsibility: Only handles model lifecycle
 * - Organization: Clear separation of initialization steps
 */
class ModelManager {
  constructor() {
    this.sequelize = sequelize;
    this.models = {
      User: UserModel,
    };
    this.initialized = false;
  }

  /**
   * Register a new model
   * @param {string} name - Model name
   * @param {Object} model - Model class
   */
  registerModel(name, model) {
    console.log(`ModelManager: Registering model '${name}'`);
    this.models[name] = model;
  }

  /**
   * Initialize all models
   * @private
   */
  _initializeModels() {
    console.log('ModelManager: Initializing models...');

    Object.values(this.models).forEach((model) => {
      if (typeof model.init === 'function') {
        model.init(this.sequelize, Sequelize.DataTypes);
        console.log(`ModelManager: Model '${model.name}' initialized`);
      }
    });
  }

  /**
   * Setup model associations
   * @private
   */
  _setupAssociations() {
    console.log('ModelManager: Setting up associations...');

    Object.values(this.models).forEach((model) => {
      if (typeof model.associate === 'function') {
        model.associate(this.models);
        console.log(`ModelManager: Associations for '${model.name}' configured`);
      }
    });
  }

  /**
   * Synchronize database schema
   * @param {Object} options - Sequelize sync options
   * @returns {Promise<boolean>}
   */
  async syncDatabase(options = { alter: true }) {
    console.log('ModelManager: Synchronizing database schema...');

    try {
      await this.sequelize.sync(options);
      console.log('✅ Database synced successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing database:', error.message);
      throw error;
    }
  }

  /**
   * Initialize models and associations
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('ModelManager: Already initialized');
      return true;
    }

    try {
      console.log('ModelManager: Starting initialization...');

      // Step 1: Initialize models
      this._initializeModels();

      // Step 2: Setup associations
      this._setupAssociations();

      // Step 3: Sync database
      await this.syncDatabase();

      this.initialized = true;
      console.log('✅ ModelManager: Initialization completed');
      return true;
    } catch (error) {
      console.error('❌ ModelManager: Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all registered models
   * @returns {Object}
   */
  getModels() {
    return this.models;
  }

  /**
   * Get a specific model by name
   * @param {string} name - Model name
   * @returns {Object|null}
   */
  getModel(name) {
    return this.models[name] || null;
  }

  /**
   * Get Sequelize instance
   * @returns {Sequelize}
   */
  getSequelize() {
    return this.sequelize;
  }
}

// Export singleton instance
const modelManager = new ModelManager();

module.exports = {
  modelManager,
  sequelize,
  models: modelManager.getModels(),
  syncDatabase: (options) => modelManager.syncDatabase(options),
};
