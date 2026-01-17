const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');

const setupApplication = require('./setup');
const { initSocket, socketService } = require('../services/socket');
const redis = require('../services/redis');
const nodemailer = require('../services/nodemailer');
const aws = require('../services/aws');

/**
 * ServerManager - Manages HTTP/HTTPS server lifecycle
 *
 * Handles server creation, startup, and graceful shutdown
 * Follows OOP principles:
 * - Encapsulation: Server management logic in one class
 * - Single Responsibility: Only handles server lifecycle
 * - Clean shutdown: Proper resource cleanup
 */
class ServerManager {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = process.env.APPLICATION_PORT || 8000;
  }

  /**
       * Create HTTP or HTTPS server based on configuration
       * @private
       */
  _createServer() {
    if (process.env.SSL_STATUS === 'true') {
      console.log('🔒 Creating HTTPS server...');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const key = fs.readFileSync(process.env.SSL_KEY_PEM_PATH, 'utf8');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const cert = fs.readFileSync(process.env.SSL_CERT_PEM_PATH, 'utf8');
      const options = { key, cert };
      this.server = https.createServer(options, this.app);
      console.log('✅ HTTPS server created');
    } else {
      console.log('🌐 Creating HTTP server...');
      this.server = http.Server(this.app);
      console.log('✅ HTTP server created');
    }
  }

  /**
       * Initialize Socket.IO
       * @private
       */
  _initializeSocket() {
    console.log('🔌 Initializing Socket.IO...');
    initSocket(this.server);
    console.log('✅ Socket.IO initialized');
  }

  /**
       * Start listening on configured port
       * @private
       */
  _startListening() {
    return new Promise((resolve) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        const protocol = process.env.SSL_STATUS === 'true' ? 'https' : 'http';
        console.log(`\n🚀 Server listening on port: ${this.port}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 URL: ${protocol}://localhost:${this.port}\n`);
        resolve();
      });
    });
  }

  /**
       * Start the server
       */
  async start() {
    try {
      console.log('🎬 Starting server initialization...\n');

      // Step 1: Setup application (middleware, routes, etc.)
      await setupApplication(this.app);

      // Step 2: Create server
      this._createServer();

      // Step 3: Initialize Socket.IO
      this._initializeSocket();

      // Step 4: Start listening
      await this._startListening();

      console.log('✅ Server started successfully!\n');
    } catch (err) {
      console.error('\n❌ Failed to start server:');
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      console.error('Stack Trace:', err.stack);
      process.exit(1);
    }
  }

  /**
       * Graceful shutdown
       */
  async shutdown(signal) {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...\n`);

    try {
      // Close server
      if (this.server) {
        console.log('🔌 Closing HTTP/HTTPS server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('✅ Server closed');
      }

      // Cleanup all services
      console.log('🧹 Cleaning up services...');

      await Promise.all([
        redis.cleanup ? redis.cleanup() : Promise.resolve(),
        nodemailer.cleanup ? nodemailer.cleanup() : Promise.resolve(),
        aws.cleanup ? aws.cleanup() : Promise.resolve(),
        socketService?.cleanup ? socketService.cleanup() : Promise.resolve(),
      ]);

      console.log('✅ All services cleaned up');
      console.log('👋 Graceful shutdown completed\n');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
       * Get Express app instance
       */
  getApp() {
    return this.app;
  }

  /**
       * Get server instance
       */
  getServer() {
    return this.server;
  }
}

module.exports = ServerManager;
