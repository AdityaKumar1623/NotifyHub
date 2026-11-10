const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WEBHOOK'],
      required: true,
    },
    priority: {
      type: Number,
      enum: [1, 5, 10],
      default: 5,
    },
    templateId: {
      type: String,
      default: 'OTP',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'DELIVERED', 'FAILED'],
      default: 'QUEUED',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    errorReason: {
      type: String,
      default: null,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
