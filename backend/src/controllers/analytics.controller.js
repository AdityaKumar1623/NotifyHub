const Notification = require('../models/Notification');

exports.getMetrics = async (req, res) => {
  try {
    const [ingested, queued, delivered, failed] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: { $in: ['QUEUED', 'PROCESSING'] } }),
      Notification.countDocuments({ status: 'DELIVERED' }),
      Notification.countDocuments({ status: 'FAILED' }),
    ]);

    const total = ingested || 1;
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';

    return res.json({
      ingested,
      queued,
      delivered,
      failed,
      dlq: failed,
      deliveryRate: Number(deliveryRate),
      system: 'HEALTHY',
      redis: 'CONNECTED',
      mongo: 'UP',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: error.message || 'Unable to load analytics' });
  }
};
