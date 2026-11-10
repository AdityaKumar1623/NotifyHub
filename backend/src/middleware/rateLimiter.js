const redis = require('../config/redis');

module.exports = function rateLimiter({ windowMs = 60000, maxRequests = 100 } = {}) {
  return async function limiter(req, res, next) {
    try {
      const clientKey = req.headers['x-api-key'] || req.ip || 'anonymous';
      const now = Date.now();
      const key = `notifyhub:rl:${clientKey}`;
      const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random().toString(16).slice(2)}`);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const requestCount = results?.[1]?.[1] ?? 0;

      if (requestCount >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfterMs: windowMs,
          limit: maxRequests,
        });
      }

      req.rateLimit = {
        limit: maxRequests,
        remaining: Math.max(maxRequests - requestCount - 1, 0),
        resetMs: windowMs,
      };

      return next();
    } catch (error) {
      console.error('Rate limiter error:', error.message);
      return next();
    }
  };
};
