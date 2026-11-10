const { Worker } = require('bullmq');
const notificationRedis = require('../config/redis');
const Notification = require('../models/Notification');
const Template = require('../models/Template');
const { dlqQueue } = require('../queues/notification.queue');
const { renderTemplate, validateRequiredVars } = require('../services/template.service');
const { sendEmail } = require('../providers/email.provider');
const { sendWebhook } = require('../providers/webhook.provider');
const { sendSMS } = require('../providers/sms.provider');
const { getChaosFlags } = require('../middleware/chaos');
const eventBus = require('../utils/eventBus');

const FALLBACK_TEMPLATES = {
  OTP: {
    templateId: 'OTP',
    channel: 'EMAIL',
    subject: 'Your OTP code is {{otp}}',
    body: 'Hello {{name}}, your OTP is {{otp}}.',
    requiredVars: ['name', 'otp'],
  },
  ORDER_ALERT: {
    templateId: 'ORDER_ALERT',
    channel: 'EMAIL',
    subject: 'Order update for {{customerName}}',
    body: 'Order {{orderId}} status is {{status}}.',
    requiredVars: ['customerName', 'orderId', 'status'],
  },
  DELIVERY_STATUS: {
    templateId: 'DELIVERY_STATUS',
    channel: 'WEBHOOK',
    subject: 'Delivery status',
    body: 'Driver {{driverName}} is {{status}} for order {{orderId}}.',
    requiredVars: ['driverName', 'status', 'orderId'],
  },
};

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getTemplate(templateId, channel) {
  const templateRecord = await Template.findOne({ templateId }).lean();
  if (templateRecord) return templateRecord;
  return FALLBACK_TEMPLATES[templateId] || {
    templateId,
    channel,
    subject: 'Notification',
    body: 'Hello, you have a new notification.',
    requiredVars: [],
  };
}

async function dispatchNotification({ recipient, channel, templateId, data }) {
  const template = await getTemplate(templateId, channel);
  const body = template.body || 'New notification';
  const subject = template.subject || 'Notification';

  validateRequiredVars(body, data);
  validateRequiredVars(subject, data);

  const renderedBody = renderTemplate(body, data);
  const renderedSubject = renderTemplate(subject, data);

  let providerResponse;
  switch (channel) {
    case 'EMAIL':
      providerResponse = await sendEmail({
        to: recipient,
        subject: renderedSubject,
        html: `<div><p>${renderedBody}</p></div>`,
        text: renderedBody,
      });
      break;
    case 'SMS':
      providerResponse = await sendSMS({ to: recipient, body: renderedBody });
      break;
    case 'WEBHOOK':
      providerResponse = await sendWebhook({
        url: recipient,
        payload: { text: renderedBody, ...data },
      });
      break;
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }

  return { providerResponse, renderedBody, renderedSubject };
}

const worker = new Worker(
  'notification-queue',
  async (job) => {
    const { jobId, recipient, channel, priority, templateId, data = {} } = job.data;
    const currentAttempt = (job.attemptsMade ?? 0) + 1;
    const chaosFlags = await getChaosFlags();

    await Notification.findOneAndUpdate(
      { jobId },
      {
        $set: {
          recipient,
          channel,
          priority,
          templateId,
          data,
          status: 'PROCESSING',
          attempts: currentAttempt,
          errorReason: null,
        },
      },
      { upsert: true, new: true }
    );

    if (chaosFlags.CHAOS_INJECT_LATENCY) {
      console.warn(`Chaos fault injected: delaying job ${jobId} by 2000ms`);
      await delay(2000);
    }

    const { providerResponse, renderedBody, renderedSubject } = await dispatchNotification({
      recipient,
      channel,
      templateId,
      data,
    });

    await Notification.findOneAndUpdate(
      { jobId },
      {
        $set: {
          status: 'DELIVERED',
          attempts: currentAttempt,
          errorReason: null,
          providerResponse,
        },
      },
      { upsert: true, new: true }
    );

    eventBus.emit('notification-event', {
      type: 'delivery',
      jobId,
      recipient,
      channel,
      priority,
      status: 'DELIVERED',
      attempts: currentAttempt,
      templateId,
      data,
      renderedBody,
      renderedSubject,
      providerResponse,
      createdAt: new Date().toISOString(),
    });
    return providerResponse;
  },
  {
    connection: notificationRedis,
    concurrency: 4,
  }
);

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

worker.on('failed', async (job, error) => {
  if (!job) {
    console.error('Notification job failed without job metadata:', error.message);
    return;
  }

  const jobId = job.data?.jobId || job.id;
  const payload = job.data || {};
  const attemptsMade = job.attemptsMade || 1;
  const maxAttempts = job.opts?.attempts || 4;
  const isFinalAttempt = attemptsMade >= maxAttempts;

  await Notification.findOneAndUpdate(
    { jobId },
    {
      $set: {
        recipient: payload.recipient,
        channel: payload.channel,
        priority: payload.priority,
        templateId: payload.templateId,
        data: payload.data || {},
        status: isFinalAttempt ? 'FAILED' : 'QUEUED',
        attempts: attemptsMade,
        errorReason: error.message || 'Unknown processing error',
      },
    },
    { upsert: true, new: true }
  );

  const event = {
    type: 'failure',
    jobId,
    recipient: payload.recipient,
    channel: payload.channel,
    priority: payload.priority,
    status: isFinalAttempt ? 'FAILED' : 'QUEUED',
    attempts: attemptsMade,
    maxAttempts,
    errorReason: error.message || 'Unknown processing error',
    createdAt: new Date().toISOString(),
  };
  eventBus.emit('notification-event', event);

  if (isFinalAttempt) {
    await dlqQueue.add(
      'poisoned-job',
      { ...event, originalJob: payload, failedAt: new Date().toISOString() },
      { priority: payload.priority || 5 }
    );
    eventBus.emit('notification-event', {
      ...event,
      type: 'dlq',
      queue: 'notification-dlq',
    });
    console.error(`Job ${jobId} exhausted ${maxAttempts} attempts and was routed to the DLQ`);
    return;
  }

  const retryDelayMs = 2000 * (2 ** (attemptsMade - 1));
  console.warn(
    `Job ${jobId} failed on attempt ${attemptsMade}/${maxAttempts}; BullMQ will retry after ${retryDelayMs}ms:`,
    error.message
  );
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

module.exports = worker;
