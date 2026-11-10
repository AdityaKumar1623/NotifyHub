const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  retryStrategy(times) {
    const delay = Math.min(times * 2000, 15000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = [/READONLY/i, /ETIMEDOUT/i, /ECONNRESET/i, /ECONNREFUSED/i];
    return targetErrors.some((pattern) => pattern.test(String(err)));
  },
  lazyConnect: false,
  keepAlive: 30000,
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (error) => {
  console.error('Redis error:', error.message);
});

module.exports = redis;
