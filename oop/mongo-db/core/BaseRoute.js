const express = require('express');

/**
 * BaseRoute - Abstract Base Class for all Routes
 * Provides common route configuration and helper methods
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
   */
  getRouter() {
    return this.router;
  }

  /**
  * Register a GET route
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
  */
  delete(path, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.router.delete(path, middleware, handler);
    } else {
      this.router.delete(path, middleware);
    }
  }

  /**
  * Initialize routes (abstract)
  */
  initializeRoutes() {
    throw new Error(`${this.routeName} must implement initializeRoutes() method`);
  }

  /**
  * Log route registration
  */
  _log(message) {
    console.log(`${this.routeName}: ${message}`);
  }
}

module.exports = BaseRoute;
