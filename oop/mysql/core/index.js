/**
 * Core Module - Exports all base classes
 */

const BaseController = require('./BaseController');
const BaseResource = require('./BaseResource');
const BaseService = require('./BaseService');
const BaseValidation = require('./BaseValidation');
const BaseRoute = require('./BaseRoute');

module.exports = {
  BaseController,
  BaseResource,
  BaseService,
  BaseValidation,
  BaseRoute,
};
