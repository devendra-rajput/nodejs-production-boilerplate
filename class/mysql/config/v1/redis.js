const Redis = require('ioredis');

const redisUrl = `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;

const redisClient = new Redis(redisUrl, {
  lazyConnect: true, // Don't connect immediately
});

// Connect Redis server
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully!');
  } catch (error) {
    console.error(`Redis Error: ${error}`);
    process.exit(1);
  }
};

redisClient.on('ready', () => {
  console.log('Redis have ready!');
});

redisClient.on('error', async (error) => {
  console.error(`Redis Error: ${error}`);
});

module.exports = {
  redisClient,
  connectRedis,
};
