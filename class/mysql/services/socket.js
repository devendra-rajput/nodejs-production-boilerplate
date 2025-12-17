const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

/** Custom Require * */
const i18n = require('../config/i18n');
const UserResources = require('../resources/v1/users/users.resources');
const socketEvents = require('../constants/socket_events');

let io;

// Wrap jwt.verify into a Promise for better async/await support
const verifyToken = (token) => new Promise((resolve, reject) => {
  jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, decoded) => {
    if (err) {
      return reject(err); // Reject with the error if verification fails
    }
    resolve(decoded); // Resolve with decoded payload if token is valid
  });
});

const initSocket = (httpServer) => {
  const socketConfig = {
    path: '/socket.io', // Standard path
    cors: {
      origin: '*', // Adjust as needed for security
      methods: ['GET', 'POST'],
    },
  };

  io = new Server(httpServer, socketConfig);
  console.log('Socket.IO initialized on path:', socketConfig.path);

  if (!io) {
    throw new Error('Socket.io not initialized');
  } else {
    io.use(async (socket, next) => {
      let token = socket.handshake.headers.authorization;

      // Also check for token in the standard auth object
      if (!token && socket?.handshake?.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error(i18n.__('socket.noToken')));
      }

      if (token.startsWith('Bearer ')) {
        [, token] = token.split(' ');
      }

      try {
        /** Verify the token */
        const decoded = await verifyToken(token);

        // Find user by decoded user_id
        const user = await UserResources.getOneByColumnNameAndValue('id', decoded.user_id);
        if (!user) {
          return next(new Error(i18n.__('socket.noUserFound')));
        }

        // Check if the token matches the stored auth_token for the user
        if (!user?.auth_token || user.auth_token !== token) {
          return next(new Error(i18n.__('socket.tokenMismatch')));
        }

        /** Attach user info to socket for future use */
        // eslint-disable-next-line no-param-reassign
        socket.user = user;

        next();
      } catch (err) {
        return next(new Error(i18n.__('socket.invalidToken')));
      }
    });

    io.on('connection', async (socket) => {
      
      const userId = socket.user?.id;
      console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

      // Join a room specific to this user for easy targeting
      // Room name: user_<id>
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined room user_${userId}`);
      }

      // This is a test event
      socket.on(socketEvents.ON.TEST_EVENT, (data, callback) => {
        callback({ message: 'Test event received', data });
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
      });
    });
  }
};

const emitToUsers = (userIds, event, data) => {
  if (io) {
    userIds.forEach((userId) => {
      io.to(`user_${userId}`).emit(event, data);
    });
  }
};

module.exports = {
  io,
  initSocket,
  emitToUsers,
};
