/**
 * BaseController - Abstract Base Class for all Controllers
 *
 * This class provides common functionality for all controllers following OOP principles:
 * - Encapsulation: Protected methods for internal use
 * - Abstraction: Abstract methods that must be implemented by child classes
 * - Single Responsibility: Each controller handles one resource
 *
 * @abstract
 */
class BaseController {
  constructor(model, response = null, dataHelper = null) {
    if (new.target === BaseController) {
      throw new TypeError('Cannot construct BaseController instances directly');
    }

    this.model = model;
    this.response = response;
    this.dataHelper = dataHelper;
    this._validateModel();
  }

  /**
     * Validate that the model is properly injected (Dependency Injection)
     * @private
     */
  _validateModel() {
    if (!this.model) {
      throw new Error(`${this.constructor.name} requires a model to be injected`);
    }
  }

  /**
     * Bind all methods to preserve 'this' context when used as callbacks
     * This is necessary for Express route handlers
     * @protected
     */
  _bindMethods(...methodNames) {
    methodNames.forEach((methodName) => {
      if (typeof this[methodName] === 'function') {
        this[methodName] = this[methodName].bind(this);
      }
    });
  }

  /**
     * Automatically bind all methods of the class (except private/protected ones)
     * Call this in child constructor after defining all methods
     * @protected
     */
  _autoBindMethods() {
    const prototype = Object.getPrototypeOf(this);
    Object.getOwnPropertyNames(prototype).forEach((methodName) => {
      // Skip constructor, private methods (_method), and already bound methods
      if (
        methodName !== 'constructor'
        && !methodName.startsWith('_')
        && typeof this[methodName] === 'function'
      ) {
        this[methodName] = this[methodName].bind(this);
      }
    });
  }

  /**
     * Log controller action with resource name
     * @protected
     */
  _logAction(action, data = null) {
    console.log(`${this.constructor.name}@${action}`, data || '');
  }

  /**
     * Handle errors consistently across all controllers
     * @protected
     */
  _handleError(error, res, response) {
    console.error(`${this.constructor.name} Error:`, error);
    return response.exception('error.serverError', res, false);
  }

  /**
     * Extract pagination parameters
     * @protected
     */
  async _getPaginationParams(query, dataHelper) {
    return dataHelper.getPageAndLimit(query);
  }
}

module.exports = BaseController;
