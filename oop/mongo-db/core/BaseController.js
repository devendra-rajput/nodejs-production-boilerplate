/**
 * BaseController - Abstract Base Class for all Controllers
 * Provides common functionality for controllers (OOP)
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
  * Validate that the model is properly injected
  */
  _validateModel() {
    if (!this.model) {
      throw new Error(`${this.constructor.name} requires a model to be injected`);
    }
  }

  /**
  * Bind all methods to preserve 'this' context
  */
  _bindMethods(...methodNames) {
    methodNames.forEach((methodName) => {
      if (typeof this[methodName] === 'function') {
        this[methodName] = this[methodName].bind(this);
      }
    });
  }

  /**
  * Automatically bind all methods of the class
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
  * Log controller action
  */
  _logAction(action, data = null) {
    console.log(`${this.constructor.name}@${action}`, data || '');
  }

  /**
  * Handle errors consistently
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
