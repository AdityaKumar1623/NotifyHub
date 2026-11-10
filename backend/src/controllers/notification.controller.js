const Notification = require('../models/Notification');
const { notificationQueue, PRIORITY } = require('../queues/notification.queue');
const eventBus = require('../utils/eventBus');

const PRIORITY_MAP = {
  HIGH: PRIORITY.HIGH,
  MEDIUM: PRIORITY.MEDIUM,
  LOW: PRIORITY.LOW,
  1: PRIORITY.HIGH,
  5: PRIORITY.MEDIUM,
  10: PRIORITY.LOW,
};

exports.createNotification = async (req, res) => {
  try {
    const {
      recipient,
      channel = 'EMAIL',
      priority = 'MEDIUM',
      templateId = 'OTP',
      data = {},
    } = req.body;

    if (!recipient) {
      return res.status(400).json({ error: 'recipient is required' });
    }

    const normalizedChannel = String(channel).toUpperCase();
    const normalizedPriority = PRIORITY_MAP[priority] ?? PRIORITY.MEDIUM;

    if (!['EMAIL', 'SMS', 'WEBHOOK'].includes(normalizedChannel)) {
      return res.status(400).json({ error: 'Unsupported channel' });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    const notificationPayload = {
      jobId,
      recipient,
      channel: normalizedChannel,
      priority: normalizedPriority,
      templateId,
      data,
      status: 'QUEUED',
      attempts: 0,
      errorReason: null,
    };

    await Notification.create(notificationPayload);

    const job = await notificationQueue.add(
      'send',
      { ...notificationPayload },
      {
        jobId,
        priority: normalizedPriority,
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    eventBus.emit('notification-event', {
      type: 'ingested',
      jobId: job.id,
      recipient,
      channel: normalizedChannel,
      priority: normalizedPriority,
      status: 'QUEUED',
      attempts: 0,
      templateId,
      data,
      maxAttempts: 4,
      createdAt: new Date().toISOString(),
    });

    return res.status(202).json({
      message: 'Notification accepted for processing',
      jobId: job.id,
      channel: normalizedChannel,
      priority: normalizedPriority,
      status: 'QUEUED',
    });
  } catch (error) {
    console.error('Notification create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to enqueue notification' });
  }
};

exports.getNotificationStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const notification = await Notification.findOne({ jobId }).lean();

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load notification' });
  }
};

exports.listDlqJobs = async (_req, res) => {
  try {
    const jobs = await Notification.find({ status: 'FAILED' }).sort({ updatedAt: -1 }).limit(20).lean();
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load DLQ jobs' });
  }
};

exports.retryDlqJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const notification = await Notification.findOne({ jobId }).lean();

    if (!notification) {
      return res.status(404).json({ error: 'Failed job not found in DLQ' });
    }

    const retryJobId = `${jobId}-retry-${Date.now()}`;
    const retryJob = await notificationQueue.add(
      'send',
      {
        ...notification,
        status: 'QUEUED',
        attempts: 0,
        errorReason: null,
      },
      {
        jobId: retryJobId,
        priority: notification.priority || PRIORITY.MEDIUM,
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    await Notification.updateOne(
      { jobId },
      {
        $set: {
          status: 'QUEUED',
          attempts: 0,
          errorReason: null,
          providerResponse: {},
          updatedAt: new Date(),
        },
      }
    );

    eventBus.emit('notification-event', {
      type: 'replayed',
      jobId: retryJob.id,
      originalJobId: jobId,
      recipient: notification.recipient,
      channel: notification.channel,
      priority: notification.priority,
      status: 'QUEUED',
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    return res.status(202).json({
      message: 'Retry job re-enqueued',
      jobId: retryJob.id,
      originalJobId: jobId,
    });
  } catch (error) {
    console.error('Retry DLQ job error:', error);
    return res.status(500).json({ error: error.message || 'Retry failed' });
  }
};
