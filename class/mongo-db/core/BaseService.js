/**
 * BaseService - Abstract Base Class for all Services
 *
 * This class provides common service layer functionality:
 * - Encapsulation: Private methods for internal operations
 * - Single Responsibility: Each service handles specific business logic
 * - Dependency Injection: Services can be injected with dependencies
 *
 * @abstract
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
     * Get service name
     * @protected
     */
  getServiceName() {
    return this.serviceName;
  }

  /**
     * Check if service is initialized
     * @protected
     */
  isInitialized() {
    return this._initialized;
  }

  /**
     * Mark service as initialized
     * @protected
     */
  _setInitialized(status = true) {
    this._initialized = status;
  }

  /**
     * Initialize service (can be overridden)
     * @returns {Promise<boolean>}
     */
  async initialize() {
    console.log(`${this.serviceName}@initialize`);
    this._setInitialized(true);
    return true;
  }

  /**
     * Cleanup service resources (can be overridden)
     * @returns {Promise<boolean>}
     */
  async cleanup() {
    console.log(`${this.serviceName}@cleanup`);
    this._setInitialized(false);
    return true;
  }

  /**
     * Handle service errors
     * @protected
     */
  _handleError(methodName, error) {
    console.error(`${this.serviceName}@${methodName} Error:`, error);
    throw new Error(`Error: ${error}`);
  }

  /**
     * Validate required parameters
     * @protected
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
     * @protected
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
