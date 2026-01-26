/**
 * ProcessManager - Handles Node.js process-level events
 */
class ProcessManager {
  constructor(serverManager) {
    this.serverManager = serverManager;
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  _setupSignalHandlers() {
    process.on('SIGTERM', () => {
      console.log('\n📡 SIGTERM signal received');
      this.serverManager.shutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('\n📡 SIGINT signal received (Ctrl+C)');
      this.serverManager.shutdown('SIGINT');
    });
  }

  /**
   * Setup error handlers for uncaught errors
   */
  _setupErrorHandlers() {
    process.on('uncaughtException', (err) => {
      console.error('\n💥 UNCAUGHT EXCEPTION! Shutting down...');
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      console.error('Stack Trace:', err.stack);
      this.serverManager.shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (err) => {
      console.error('\n💥 UNHANDLED REJECTION! Shutting down...');
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      console.error('Stack Trace:', err.stack);
      this.serverManager.shutdown('UNHANDLED_REJECTION');
    });
  }

  /**
     * Initialize all process handlers
     */
  initialize() {
    this._setupSignalHandlers();
    this._setupErrorHandlers();
    console.log('✅ Process handlers initialized\n');
  }
}

module.exports = ProcessManager;
