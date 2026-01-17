/**
 * Load environment variables FIRST before any other imports
 * This ensures all modules have access to process.env
 */
const dotenv = require('dotenv');

try {
  const env = process.env.NODE_ENV || 'development';
  dotenv.config({
    path: `.env.${env}`,
  });
  console.log(`✅ Environment loaded: ${env}`);
} catch (err) {
  console.error('❌ Error loading .env file:');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}

// Disable logs if configured
if (process.env.LOG_DISABLE === 'true') {
  // eslint-disable-next-line no-console
  console.log = function noop() { };
}

const ServerManager = require('./bootstrap/serverManager');
const ProcessManager = require('./bootstrap/processManager');

/**
 * Application Entry Point
 */
class Application {
  /**
   * Run the application
   */
  static async run() {
    // Step 1: Create server manager
    const serverManager = new ServerManager();

    // Step 2: Setup process handlers
    const processManager = new ProcessManager(serverManager);
    processManager.initialize();

    // Step 3: Start server
    await serverManager.start();
  }
}

// Run the application
Application.run().catch((error) => {
  console.error('\n❌ Application failed to start:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
