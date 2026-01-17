const express = require('express');

/**
 * BaseRoute - Abstract Base Class for all Routes
 *
 * This class provides common route functionality:
 * - Encapsulation: Route configuration in one place
 * - Single Responsibility: Each route class handles specific resource
 * - Clean Code: Eliminates repetitive middleware arrays
 *
 * @abstract
 */
class BaseRoute {
  constructor(routeName = 'BaseRoute') {
    if (new.target === BaseRoute) {
      throw new TypeError('Cannot construct BaseRoute instances directly');
    }

    this.routeName = routeName;
    this.router = express.Router();
  }

  /**
     * Get the Express router instance
     * @returns {express.Router}
     */
  getRouter() {
    return this.router;
  }

  /**
     * Register a GET route
     * @protected
     * @param {string} path - Route path
     * @param {Array} middleware - Middleware array
     * @param {Function} handler - Route handler
     */
  get(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.get(path, middleware, handler);
    } else {
      this.router.get(path, middleware);
    }
  }

  /**
     * Register a POST route
     * @protected
     * @param {string} path - Route path
     * @param {Array} middleware - Middleware array
     * @param {Function} handler - Route handler
     */
  post(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.post(path, middleware, handler);
    } else {
      this.router.post(path, middleware);
    }
  }

  /**
     * Register a PUT route
     * @protected
     * @param {string} path - Route path
     * @param {Array} middleware - Middleware array
     * @param {Function} handler - Route handler
     */
  put(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.put(path, middleware, handler);
    } else {
      this.router.put(path, middleware);
    }
  }

  /**
     * Register a PATCH route
     * @protected
     * @param {string} path - Route path
     * @param {Array} middleware - Middleware array
     * @param {Function} handler - Route handler
     */
  patch(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.patch(path, middleware, handler);
    } else {
      this.router.patch(path, middleware);
    }
  }

  /**
     * Register a DELETE route
     * @protected
     * @param {string} path - Route path
     * @param {Array} middleware - Middleware array
     * @param {Function} handler - Route handler
     */
  delete(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.delete(path, middleware, handler);
    } else {
      this.router.delete(path, middleware);
    }
  }

  /**
     * Initialize routes (must be implemented by child classes)
     * @abstract
     */
  initializeRoutes() {
    throw new Error(`${this.routeName} must implement initializeRoutes() method`);
  }

  /**
     * Log route registration
     * @protected
     */
  _log(message) {
    console.log(`${this.routeName}: ${message}`);
  }
}

module.exports = BaseRoute;
