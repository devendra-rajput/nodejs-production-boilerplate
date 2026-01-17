const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { BaseService } = require('../core');
const i18n = require('../config/i18n');
const UserResource = require('../resources/v1/users/users.resource');
const socketEvents = require('../constants/socket_events');

/**
 * SocketService - Extends BaseService
 *
 * Handles Socket.IO real-time communication
 * Demonstrates:
 * - Inheritance: Extends BaseService
 * - Encapsulation: Uses protected methods from base class
 * - Singleton Pattern: Single io instance
 */
class SocketService extends BaseService {
  constructor() {
    super('SocketService');
    this.io = null;
  }

  /**
   * Verify JWT token
   * @private
   */
  _verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  }

  /**
   * Extract token from socket handshake
   * @private
   */
  _extractToken(socket) {
    let token = socket.handshake.headers.authorization;

    if (!token && socket?.handshake?.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (token && token.startsWith('Bearer ')) {
      [, token] = token.split(' ');
    }

    return token;
  }

  /**
   * Socket authentication middleware
   * @private
   */
  async _authenticateSocket(socket, next) {
    return this._executeWithErrorHandling('authenticateSocket', async () => {
      const token = this._extractToken(socket);

      if (!token) {
        return next(new Error(i18n.__('socket.noToken')));
      }

      // Verify token
      const decoded = await this._verifyToken(token);

      // Find user
      const user = await UserResource.getOneByColumnNameAndValue('id', decoded.user_id);
      if (!user) {
        return next(new Error(i18n.__('socket.noUserFound')));
      }

      // Check token match
      if (!user?.auth_token || user.auth_token !== token) {
        return next(new Error(i18n.__('socket.tokenMismatch')));
      }

      // Attach user to socket
      // eslint-disable-next-line no-param-reassign
      socket.user = user;

      next();
    }).catch((error) => {
      console.error(`${this.serviceName}@authenticateSocket Error:`, error);
      return next(new Error(i18n.__('socket.invalidToken')));
    });
  }

  /**
   * Handle socket connection
   * @private
   */
  _handleConnection(socket) {
    const userId = socket.user?.id;
    console.log(`${this.serviceName}: User connected - ${userId} (Socket ID: ${socket.id})`);

    // Join user-specific room
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`${this.serviceName}: Socket ${socket.id} joined room user_${userId}`);
    }

    // Test event
    socket.on(socketEvents.ON.TEST_EVENT, (data, callback) => {
      callback({ message: 'Test event received', data });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`${this.serviceName}: User disconnected - ${userId}`);
    });
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} httpServer - HTTP server instance
   * @override
   */
  async initialize(httpServer) {
    return this._executeWithErrorHandling('initialize', async () => {
      this._validateParams({ httpServer }, ['httpServer']);

      const socketConfig = {
        path: '/socket.io',
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      };

      this.io = new Server(httpServer, socketConfig);
      console.log(`${this.serviceName}: Initialized on path ${socketConfig.path}`);

      // Setup authentication middleware
      this.io.use((socket, next) => this._authenticateSocket(socket, next));

      // Handle connections
      this.io.on('connection', (socket) => this._handleConnection(socket));

      this._setInitialized(true);
      return true;
    });
  }

  /**
   * Emit event to specific users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string} event - Event name
   * @param {*} data - Data to emit
   */
  emitToUsers(userIds, event, data) {
    if (!this.io) {
      console.warn(`${this.serviceName}: Cannot emit - Socket.IO not initialized`);
      return false;
    }

    userIds.forEach((userId) => {
      this.io.to(`user_${userId}`).emit(event, data);
    });

    return true;
  }

  /**
   * Get Socket.IO instance
   * @returns {Server|null}
   */
  getIO() {
    return this.io;
  }

  /**
   * Cleanup Socket.IO server
   * @override
   */
  async cleanup() {
    return this._executeWithErrorHandling('cleanup', async () => {
      if (this.io) {
        this.io.close();
        this.io = null;
      }
      this._setInitialized(false);
      console.log(`${this.serviceName}: Cleanup completed`);
      return true;
    });
  }
}

// Export singleton instance
const socketService = new SocketService();

module.exports = {
  io: socketService.getIO(),
  initSocket: (httpServer) => socketService.initialize(httpServer),
  emitToUsers: (userIds, event, data) => socketService.emitToUsers(userIds, event, data),
  socketService, // Export instance for direct access if needed
};
