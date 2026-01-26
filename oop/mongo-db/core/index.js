/**
 * Core Module
 * Exports foundation base classes for OOP architecture
 */

const BaseController = require('./BaseController');
const BaseModel = require('./BaseModel');
const BaseService = require('./BaseService');
const BaseValidation = require('./BaseValidation');
const BaseRoute = require('./BaseRoute');

module.exports = {
  BaseController,
  BaseModel,
  BaseService,
  BaseValidation,
  BaseRoute,
};
