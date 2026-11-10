const redis = require('../config/redis');

const TTL_SECONDS = 300;

function sendDuplicate(res, cachedResponse) {
  const cached = JSON.parse(cachedResponse);
  return res.status(200).json({
    ...cached.body,
    status: 'DUPLICATE_IGNORED',
    duplicate: true,
  });
}

module.exports = function idempotency(req, res, next) {
  const key = req.get('Idempotency-Key');
  if (!key) return next();

  if (key.length > 200) {
    return res.status(400).json({ error: 'Idempotency-Key must be 200 characters or fewer' });
  }

  const responseKey = `idempotency:${key}`;
  const pendingKey = `${responseKey}:pending`;

  (async () => {
    const cachedResponse = await redis.get(responseKey);
    if (cachedResponse) {
      return sendDuplicate(res, cachedResponse);
    }

    const claimed = await redis.set(pendingKey, '1', 'EX', TTL_SECONDS, 'NX');
    if (!claimed) {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const result = await redis.get(responseKey);
        if (result) return sendDuplicate(res, result);
      }
      return res.status(409).json({
        error: 'A request with this Idempotency-Key is already being processed',
        status: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }

    req.idempotency = { responseKey, pendingKey };
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        redis
          .del(pendingKey)
          .then(() => originalJson(body))
          .catch((error) => {
            console.error('Unable to release idempotency lock:', error.message);
            if (!res.headersSent) originalJson(body);
          });
        return res;
      }

      redis
        .setex(responseKey, TTL_SECONDS, JSON.stringify({ statusCode: res.statusCode, body }))
        .then(() => redis.del(pendingKey))
        .then(() => originalJson(body))
        .catch((error) => {
          console.error('Unable to cache idempotent response:', error.message);
          redis.del(pendingKey).catch((releaseError) => {
            console.error('Unable to release idempotency lock:', releaseError.message);
          });
          if (!res.headersSent) {
            res.setHeader('X-Idempotency-Cache', 'unavailable');
            originalJson(body);
          }
        });
      return res;
    };

    return next();
  })().catch(next);
};
