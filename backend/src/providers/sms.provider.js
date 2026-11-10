const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getChaosFlags } = require('../middleware/chaos');

async function sendSMS({ to, body }) {
  const chaosFlags = await getChaosFlags();
  if (chaosFlags.CHAOS_DROP_SMS) {
    console.warn('Chaos fault injected: simulated carrier network timeout');
    throw new Error('Simulated SMS carrier network timeout');
  }

  const latencyMs = Number(process.env.SMS_LATENCY_MS || 1200);
  await delay(latencyMs);

  const normalizedRecipient = String(to || '').toLowerCase();
  const normalizedBody = String(body || '').toLowerCase();

  if (
    normalizedRecipient.includes('fail') ||
    normalizedBody.includes('fail') ||
    normalizedRecipient.includes('error') ||
    normalizedBody.includes('error')
  ) {
    throw new Error('Simulated SMS gateway timeout: upstream network failure');
  }

  return {
    provider: 'mock-sms',
    status: 'sent',
    to,
    message: body,
    latencyMs,
  };
}

module.exports = {
  sendSMS,
};
