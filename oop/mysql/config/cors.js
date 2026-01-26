const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsConfiguration = {
  allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-Request-Id',
  ],
  maxAge: 86400, // 24 hours
};

module.exports = corsConfiguration;
