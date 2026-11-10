const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api/v1';
const args = process.argv.slice(2);
const mode = args[0] || 'priority';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`NotifyHub demo suite: ${mode}`);

  try {
    await axios.get(`${API_BASE}/analytics`);
  } catch (error) {
    console.error('Backend is not running. Start it with: npm run dev');
    process.exit(1);
  }

  try {
    switch (mode) {
      case 'priority': {
        console.log('Sending HIGH, MEDIUM, LOW priority jobs...');
        const jobs = [
          { recipient: 'ops@notifyhub.local', channel: 'EMAIL', priority: 'LOW', templateId: 'ORDER_ALERT', data: { customerName: 'Low', orderId: 'ORD-200', status: 'queued' } },
          { recipient: 'ops@notifyhub.local', channel: 'EMAIL', priority: 'HIGH', templateId: 'OTP', data: { name: 'Alice', otp: '543210' } },
          { recipient: 'ops@notifyhub.local', channel: 'EMAIL', priority: 'MEDIUM', templateId: 'ORDER_ALERT', data: { customerName: 'Medium', orderId: 'ORD-201', status: 'shipped' } },
        ];

        const results = await Promise.all(jobs.map((job) => axios.post(`${API_BASE}/notifications/send`, job)));
        results.forEach((result) => console.log('Accepted:', result.data));
        break;
      }

      case 'retry': {
        console.log('Sending a job designed to fail repeatedly...');
        const payload = {
          recipient: 'fail-sms@notifyhub.local',
          channel: 'SMS',
          priority: 'HIGH',
          templateId: 'OTP',
          data: { name: 'Dana', otp: '867530', forceFail: true },
        };

        const response = await axios.post(`${API_BASE}/notifications/send`, payload);
        console.log('Accepted:', response.data);
        break;
      }

      case 'ratelimit': {
        console.log('Bursting 15 requests to trigger 429 responses...');
        const requests = Array.from({ length: 15 }, (_, index) =>
          axios.post(`${API_BASE}/notifications/send`, {
            recipient: `burst-${index}@notifyhub.local`,
            channel: 'EMAIL',
            priority: 'MEDIUM',
            templateId: 'OTP',
            data: { name: 'Burst', otp: '222222' },
          }).catch((error) => ({
            status: error.response?.status || 500,
            message: error.response?.data || error.message,
          }))
        );

        const results = await Promise.all(requests);
        results.forEach((result) => {
          console.log('Result:', result.status || 500, result.message || result.data || '');
        });
        break;
      }

      case 'idempotency': {
        const key = `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const payload = {
          recipient: 'idempotency-demo@notifyhub.local',
          channel: 'EMAIL',
          priority: 'MEDIUM',
          templateId: 'OTP',
          data: { name: 'Idempotency Demo', otp: '123456' },
        };
        const config = { headers: { 'Idempotency-Key': key } };

        console.log('Submitting the same request twice with one Idempotency-Key...');
        const first = await axios.post(`${API_BASE}/notifications/send`, payload, config);
        const duplicate = await axios.post(`${API_BASE}/notifications/send`, payload, config);
        console.log('First response:', first.data);
        console.log('Duplicate response:', duplicate.data);

        if (first.data.jobId !== duplicate.data.jobId || duplicate.data.status !== 'DUPLICATE_IGNORED') {
          throw new Error('Idempotency verification failed: the duplicate was not suppressed');
        }
        console.log('Verified: both calls refer to one queued job.');
        break;
      }

      default:
        console.log('Available modes: priority | retry | ratelimit | idempotency');
    }
  } catch (error) {
    console.error('Demo error:', error.response?.data || error.message);
    process.exit(1);
  }

  console.log('Demo run complete.');
  await wait(1200);
}

main();
