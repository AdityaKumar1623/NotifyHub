const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WEBHOOK'],
      required: true,
    },
    subject: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      required: true,
    },
    requiredVars: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Template', templateSchema);
