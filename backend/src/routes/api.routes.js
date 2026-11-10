const express = require('express');
const notificationController = require('../controllers/notification.controller');
const batchController = require('../controllers/batch.controller');
const chaosController = require('../controllers/chaos.controller');
const analyticsController = require('../controllers/analytics.controller');
const idempotency = require('../middleware/idempotency');

const router = express.Router();

router.post('/notifications/send', idempotency, notificationController.createNotification);
router.post('/notifications/batch', batchController.ingestBatch);
router.get('/notifications/dlq', notificationController.listDlqJobs);
router.post('/notifications/dlq/:jobId/retry', notificationController.retryDlqJob);
router.get('/notifications/:jobId', notificationController.getNotificationStatus);
router.get('/analytics', analyticsController.getMetrics);
router.get('/chaos/status', chaosController.getStatus);
router.post('/chaos/toggle', chaosController.toggle);

module.exports = router;
