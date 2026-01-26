/**
 * BaseService - Abstract Base Class for all Services
 * Provides common service layer functionality
 */
class BaseService {
  constructor(serviceName = 'BaseService') {
    if (new.target === BaseService) {
      throw new TypeError('Cannot construct BaseService instances directly');
    }

    this.serviceName = serviceName;
    this._initialized = false;
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
  * Get service name
  */
  getServiceName() {
    return this.serviceName;
  }

  /**
  * Check if service is initialized
  */
  isInitialized() {
    return this._initialized;
  }

  /**
  * Mark service as initialized
  */
  _setInitialized(status = true) {
    this._initialized = status;
  }

  /**
  * Initialize service (can be overridden)
  */
  async initialize() {
    console.log(`${this.serviceName}@initialize`);
    this._setInitialized(true);
    return true;
  }

  /**
  * Cleanup service resources (can be overridden)
  */
  async cleanup() {
    console.log(`${this.serviceName}@cleanup`);
    this._setInitialized(false);
    return true;
  }

  /**
  * Handle service errors
  */
  _handleError(methodName, error) {
    console.error(`${this.serviceName}@${methodName} Error:`, error);
    throw new Error(`Error: ${error}`);
  }

  /**
  * Validate required parameters
  */
  _validateParams(params, requiredFields) {
    requiredFields.forEach((field) => {
      if (!params[field]) {
        throw new Error(`${field} is required in ${this.serviceName}`);
      }
    });
    return true;
  }

  /**
  * Execute operation with error handling
  */
  async _executeWithErrorHandling(methodName, operation) {
    try {
      return await operation();
    } catch (error) {
      return this._handleError(methodName, error);
    }
  }
}

module.exports = BaseService;
