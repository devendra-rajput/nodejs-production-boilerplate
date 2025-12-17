// eslint-disable-next-line global-require
const dotenv = require('dotenv');

try {
  dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'development'}`,
  });
} catch (err) {
  console.error('❌ Error loading .env file:');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}

// Disable all console logs if LOG_DISABLE is true
if (process.env.LOG_DISABLE === 'true') {
  // eslint-disable-next-line no-console
  console.log = function noop() { };
}

const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');

const { initSocket } = require('./services/socket');
const { connectRedis } = require('./config/v1/redis');

const app = express();
let server;

const startup = require('./startup');

// Server configuration
const startServer = async () => {
  // Connect redis server
  await connectRedis();

  await startup(app);

  const port = process.env.APPLICATION_PORT || 8000;

  if (process.env.SSL_STATUS === 'true') {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const key = fs.readFileSync(process.env.SSL_KEY_PEM_PATH, 'utf8');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const cert = fs.readFileSync(process.env.SSL_CERT_PEM_PATH, 'utf8');
    const options = { key, cert };
    server = https.createServer(options, app);
  } else {
    server = http.Server(app);
  }

  // Establish the socket.io connection
  initSocket(server);

  server.listen(port, '0.0.0.0', () => {
    console.log('listening on port:', port);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  process.exit(1);
});

// Global Error Handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
