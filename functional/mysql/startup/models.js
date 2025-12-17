const { sequelize } = require('../config/v1/mysql');
const UserModel = require('../resources/v1/users/user.model');

const models = {
  User: UserModel,
};

// Setup associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Sync database
const syncDatabase = async () => {
  try {
    // Sync all models and associations
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
  }
};

module.exports = {
  sequelize,
  models,
  syncDatabase,
};
