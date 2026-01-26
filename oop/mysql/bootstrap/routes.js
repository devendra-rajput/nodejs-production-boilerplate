const fs = require('fs').promises;
const path = require('path');

/* eslint-disable security/detect-non-literal-require, import/no-dynamic-require, global-require */

/**
 * RouteLoader - Route Registration Service
 */
class RouteLoader {
  constructor(app) {
    this.app = app;
    this.routesPath = path.join(__dirname, '../routes');
    this.registeredRoutes = [];
  }

  /**
   * Walk through directory recursively
   */
  async _walkDirectory(dir) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const files = await fs.readdir(dir);
    const results = await Promise.all(files.map(async (file) => {
      const filePath = path.join(dir, file);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) return this._walkDirectory(filePath);

      return filePath;
    }));
    return results.flat();
  }

  /**
   * Register a single route file
   */
  _registerRoute(file) {
    const routeName = path.basename(file, '.js');
    const routePath = `/api/v1/${routeName}`;

    const router = require(file);

    this.app.use(routePath, router);
    this.registeredRoutes.push({ name: routeName, path: routePath });

    console.log(`✅ Route registered: ${routePath}`);
  }

  /**
   * Register all API routes
   */
  async registerApiRoutes() {
    console.log('RouteLoader: Discovering and registering API routes...');

    const allFiles = await this._walkDirectory(this.routesPath);

    allFiles.forEach((file) => {
      this._registerRoute(file);
    });

    console.log(`RouteLoader: ${this.registeredRoutes.length} route(s) registered`);
  }

  /**
   * Register static routes
   */
  registerStaticRoutes() {
    console.log('RouteLoader: Registering static routes...');

    // Health check route
    this.app.get('/', (req, res) => res.status(200).send({
      msg: 'Everything is working fine.',
      host: req.get('host'),
      api_version: process.env.API_VER || 'v1',
    }));

    // Load testing route
    this.app.get('/load-test', (req, res) => {
      console.log('Load test hit from IP:', req.ip);
      res.status(200).send('OK');
    });

    // Static page routes
    this.app.get('/terms', (req, res) => {
      res.render('terms', {
        title: 'Terms of Service | Node JS Boilerplate | Devendra Kumar',
        headerTitle: 'Terms of Service',
        description: 'Terms and conditions for using our service.',
        companyName: 'Node JS Boilerplate',
      });
    });

    this.app.get('/privacy', (req, res) => {
      res.render('privacy', {
        title: 'Privacy Policy | Node JS Boilerplate | Devendra Kumar',
        headerTitle: 'Privacy Policy',
        description: 'Our commitment to your privacy.',
        companyName: 'Node JS Boilerplate',
      });
    });

    console.log('RouteLoader: Static routes registered');
  }

  /**
   * Register 404 handler
   */
  register404Handler() {
    this.app.use((req, res) => res.status(404).send({
      statusCode: 404,
      message: `'${req.originalUrl}' is not a valid endpoint. Please check the request URL and try again.`,
      api_version: process.env.API_VER || 'v1',
    }));

    console.log('RouteLoader: 404 handler registered');
  }

  /**
   * Initialize all routes
   */
  async initialize() {
    try {
      await this.registerApiRoutes();
      this.registerStaticRoutes();
      this.register404Handler();
      console.log('RouteLoader: All routes initialized successfully ✅');
    } catch (error) {
      console.error('RouteLoader: Error initializing routes:', error);
      process.exit(1);
    }
  }

  /**
   * Get list of registered routes
   */
  getRegisteredRoutes() {
    return this.registeredRoutes;
  }
}

/**
 * Export initialization function for backward compatibility
 */
module.exports = async (app) => {
  const routeLoader = new RouteLoader(app);
  await routeLoader.initialize();
  return routeLoader;
};
