const axios = require('axios');

async function sendWebhook({ url, payload, provider = 'discord' }) {
  const timeout = Number(process.env.WEBHOOK_TIMEOUT_MS || 6000);
  const normalizedUrl = String(url || '').trim();

  if (!normalizedUrl) {
    throw new Error('Webhook URL is required');
  }

  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    throw new Error('Webhook URL must be an http(s) URL');
  }

  const response = await axios.post(normalizedUrl, payload, {
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `NotifyHub-${provider}`,
    },
  });

  return {
    provider,
    status: response.status,
    message: response.data,
  };
}

module.exports = {
  sendWebhook,
};
