const redis = require('../config/redis');

const CHAOS_STATE_KEY = 'notifyhub:chaos:flags';
const DEFAULT_FLAGS = Object.freeze({
  CHAOS_FORCE_EMAIL_FAILURE: false,
  CHAOS_INJECT_LATENCY: false,
  CHAOS_DROP_SMS: false,
});

let memoryFlags = { ...DEFAULT_FLAGS };

function normalizeFlags(flags = {}) {
  return Object.fromEntries(
    Object.keys(DEFAULT_FLAGS).map((flag) => [flag, flags[flag] === true || flags[flag] === 'true'])
  );
}

async function getChaosFlags() {
  try {
    const stored = await redis.hgetall(CHAOS_STATE_KEY);
    memoryFlags = normalizeFlags({ ...memoryFlags, ...stored });
    return { ...memoryFlags };
  } catch (error) {
    console.error('Unable to read chaos flags from Redis; using in-memory state:', error.message);
    return { ...memoryFlags };
  }
}

async function setChaosFlags(updates) {
  const validUpdates = {};
  for (const [flag, enabled] of Object.entries(updates)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_FLAGS, flag)) {
      throw new Error(`Unknown chaos flag: ${flag}`);
    }
    if (typeof enabled !== 'boolean') {
      throw new Error(`Chaos flag ${flag} must be a boolean`);
    }
    validUpdates[flag] = enabled;
  }

  const nextFlags = { ...memoryFlags, ...validUpdates };
  if (Object.keys(validUpdates).length > 0) {
    await redis.hset(CHAOS_STATE_KEY, validUpdates);
  }
  memoryFlags = normalizeFlags(nextFlags);
  return { ...memoryFlags };
}

module.exports = {
  DEFAULT_FLAGS,
  getChaosFlags,
  setChaosFlags,
};
