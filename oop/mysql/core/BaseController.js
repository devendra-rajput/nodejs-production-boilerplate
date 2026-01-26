/**
 * BaseController - Abstract Base Class for all Controllers
 */
class BaseController {
  constructor(resource, response = null, dataHelper = null) {
    if (new.target === BaseController) {
      throw new TypeError('Cannot construct BaseController instances directly');
    }

    this.resource = resource;
    this.response = response;
    this.dataHelper = dataHelper;
    this._validateResource();
  }

  /**
   * Validate that the resource is properly injected
   */
  _validateResource() {
    if (!this.resource) {
      throw new Error(`${this.constructor.name} requires a resource to be injected`);
    }
  }

  /**
   * Bind all methods to preserve 'this' context when used as callbacks
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
   */
  _logAction(action, data = null) {
    console.log(`${this.constructor.name}@${action}`, data || '');
  }

  /**
   * Handle errors consistently across all controllers
   */
  _handleError(error, res, response) {
    console.error(`${this.constructor.name} Error:`, error);
    return response.exception('error.serverError', res, false);
  }

  /**
   * Extract pagination parameters
   */
  async _getPaginationParams(query, dataHelper) {
    return dataHelper.getPageAndLimit(query);
  }
}

module.exports = BaseController;
