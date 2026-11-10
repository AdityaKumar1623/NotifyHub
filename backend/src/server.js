require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const redis = require('./config/redis');
const rateLimiter = require('./middleware/rateLimiter');
const Template = require('./models/Template');
const apiRoutes = require('./routes/api.routes');
const eventBus = require('./utils/eventBus');
require('./workers/notification.worker');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const sseClients = new Set();

const defaultTemplates = [
  {
    templateId: 'OTP',
    channel: 'EMAIL',
    subject: 'Your OTP is {{otp}}',
    body: 'Hello {{name}}, your OTP code is {{otp}}.',
    requiredVars: ['name', 'otp'],
  },
  {
    templateId: 'ORDER_ALERT',
    channel: 'EMAIL',
    subject: 'Order {{orderId}} update',
    body: 'Hi {{customerName}}, your order {{orderId}} is now {{status}}.',
    requiredVars: ['customerName', 'orderId', 'status'],
  },
  {
    templateId: 'PROMO',
    channel: 'WEBHOOK',
    subject: 'Promotional update',
    body: 'New campaign for {{name}}: {{offer}}.',
    requiredVars: ['name', 'offer'],
  },
];

async function seedTemplates() {
  for (const template of defaultTemplates) {
    await Template.findOneAndUpdate(
      { templateId: template.templateId },
      { $set: template },
      { upsert: true, new: true }
    );
  }
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100) }));

app.get('/health', async (_req, res) => {
  const redisStatus = await redis.ping();
  res.json({
    status: 'ok',
    service: 'notifyhub-backend',
    redis: redisStatus === 'PONG' ? 'healthy' : 'degraded',
  });
});

app.get('/api/v1/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client = { id: Date.now() + Math.random(), res };
  sseClients.add(client);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream established' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

app.use('/api/v1', apiRoutes);

app.get('/api/v1/templates', async (_req, res) => {
  const templates = await Template.find({}).lean();
  return res.json(templates);
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const streamEvent = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    client.res.write(payload);
  }
};

eventBus.on('notification-event', streamEvent);

async function startServer() {
  await connectDB();
  await seedTemplates();
  app.listen(PORT, () => {
    console.log(`NotifyHub backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

module.exports = app;
