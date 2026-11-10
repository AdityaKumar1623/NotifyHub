const Notification = require('../models/Notification');
const { notificationQueue, PRIORITY } = require('../queues/notification.queue');
const eventBus = require('../utils/eventBus');

const PRIORITIES = {
  HIGH: PRIORITY.HIGH,
  MEDIUM: PRIORITY.MEDIUM,
  LOW: PRIORITY.LOW,
  1: PRIORITY.HIGH,
  5: PRIORITY.MEDIUM,
  10: PRIORITY.LOW,
};
const CHANNELS = new Set(['EMAIL', 'SMS', 'WEBHOOK']);

exports.ingestBatch = async (req, res) => {
  const { notifications } = req.body || {};
  if (!Array.isArray(notifications) || notifications.length === 0 || notifications.length > 50) {
    return res.status(400).json({ error: 'notifications must be an array containing 1 to 50 items' });
  }

  try {
    const payloads = notifications.map((item, index) => {
      const recipient = typeof item?.recipient === 'string' ? item.recipient.trim() : '';
      const channel = String(item?.channel || 'EMAIL').toUpperCase();
      const priority = PRIORITIES[item?.priority ?? 'MEDIUM'];
      if (!recipient) throw new Error(`notifications[${index}].recipient is required`);
      if (!CHANNELS.has(channel)) throw new Error(`notifications[${index}].channel is unsupported`);
      if (priority === undefined) throw new Error(`notifications[${index}].priority is unsupported`);
      if (item?.data !== undefined && (item.data === null || typeof item.data !== 'object' || Array.isArray(item.data))) {
        throw new Error(`notifications[${index}].data must be an object`);
      }

      return {
        jobId: `job_${Date.now()}_${index}_${Math.random().toString(16).slice(2, 8)}`,
        recipient,
        channel,
        priority,
        templateId: item?.templateId || 'OTP',
        data: item?.data || {},
        status: 'QUEUED',
        attempts: 0,
        errorReason: null,
      };
    });

    await Notification.insertMany(payloads, { ordered: true });
    const startedAt = process.hrtime.bigint();
    const jobs = await notificationQueue.addBulk(
      payloads.map((payload) => ({
        name: 'send',
        data: payload,
        opts: {
          jobId: payload.jobId,
          priority: payload.priority,
          attempts: 4,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }))
    );
    const enqueueMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    payloads.forEach((payload, index) => {
      eventBus.emit('notification-event', {
        type: 'ingested',
        jobId: jobs[index].id,
        recipient: payload.recipient,
        channel: payload.channel,
        priority: payload.priority,
        status: 'QUEUED',
        attempts: 0,
        templateId: payload.templateId,
        data: payload.data,
        createdAt: new Date().toISOString(),
      });
    });

    return res.status(202).json({
      message: `${jobs.length} notifications accepted for processing`,
      count: jobs.length,
      jobIds: jobs.map((job) => job.id),
      enqueueMs: Number(enqueueMs.toFixed(2)),
      concurrency: 4,
      status: 'QUEUED',
    });
  } catch (error) {
    if (/^notifications\[\d+\]/.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Batch ingestion error:', error);
    return res.status(500).json({ error: error.message || 'Unable to enqueue batch' });
  }
};
