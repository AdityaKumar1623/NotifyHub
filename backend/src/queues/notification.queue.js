const { Queue } = require('bullmq');
const redis = require('../config/redis');

const PRIORITY = {
  HIGH: 1,
  MEDIUM: 5,
  LOW: 10,
};

const notificationQueue = new Queue('notification-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 500 },
    attempts: 4,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const dlqQueue = new Queue('notification-dlq', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 1,
  },
});

async function enqueueNotification(payload, options = {}) {
  const { priority = PRIORITY.MEDIUM, ...jobOptions } = options;

  return notificationQueue.add('send', payload, {
    priority,
    ...jobOptions,
  });
}

module.exports = {
  notificationQueue,
  dlqQueue,
  PRIORITY,
  enqueueNotification,
};
