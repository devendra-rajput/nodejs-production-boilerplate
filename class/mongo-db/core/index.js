/**
 * Core Module - Exports all base classes
 *
 * This module provides the foundational OOP architecture for the application:
 * - BaseController: Abstract controller with common functionality
 * - BaseModel: Abstract model with data access patterns
 * - BaseService: Abstract service with business logic patterns
 * - BaseValidation: Abstract validation with common validation methods
 * - BaseRoute: Abstract route with common routing patterns
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
