/**
 * Model Registry
 * Central location for all Sequelize models
 */

const Sequelize = require('sequelize');
const { sequelize: sequelizeInstance } = require('../config/v1/mysql');

const UserSchema = require('./user');

const models = {
  User: UserSchema(sequelizeInstance, Sequelize.DataTypes),
};

module.exports = models;
