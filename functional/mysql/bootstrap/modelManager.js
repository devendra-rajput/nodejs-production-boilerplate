/**
 * Model Manager
 * Handles model initialization and associations
 */

const { sequelize: sequelizeInstance } = require('../config/v1/mysql');
const models = require('../models');

let initialized = false;

/**
 * Setup model associations
 */
const setupAssociations = (modelsToAssociate) => {
  console.log('ModelManager: Setting up associations...');

  Object.values(modelsToAssociate).forEach((model) => {
    if (typeof model.associate === 'function') {
      model.associate(modelsToAssociate);
      console.log(`ModelManager: Associations for '${model.name}' configured`);
    }
  });
};

/**
 * Synchronize database schema
 */
const syncDatabase = async (options = { alter: true }) => {
  console.log('ModelManager: Synchronizing database schema...');

  try {
    await sequelizeInstance.sync(options);
    console.log('✅ Database synced successfully');
    return true;
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    throw error;
  }
};

/**
 * Initialize models and associations
 */
const initialize = async () => {
  if (initialized) {
    console.log('ModelManager: Already initialized');
    return true;
  }

  try {
    console.log('ModelManager: Starting initialization...');

    // Step 1: Setup associations
    setupAssociations(models);

    // Step 2: Sync database (disabled - using migrations instead)
    // Run migrations using: npm run db:migrate
    // await syncDatabase();
    console.log('✅ Database sync skipped (using migrations instead)');

    initialized = true;
    console.log('✅ ModelManager: Initialization completed');
    return true;
  } catch (error) {
    console.error('❌ ModelManager: Initialization failed:', error.message);
    throw error;
  }
};

const getModels = () => models;
const getModel = (name) => models[name] || null;
const getSequelize = () => sequelizeInstance;
const isInitialized = () => initialized;

module.exports = {
  initialize,
  syncDatabase,
  getModels,
  getModel,
  getSequelize,
  isInitialized,
  sequelizeInstance,
  models,
};
