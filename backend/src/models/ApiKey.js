const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    friendlyName: {
      type: String,
      default: 'Service Key',
    },
    scopes: {
      type: [String],
      default: ['notifications:write'],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
