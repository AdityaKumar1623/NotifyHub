import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, X } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BatchModal from './components/BatchModal';
import OverviewPage from './pages/OverviewPage';
import DispatchStudioPage from './pages/DispatchStudioPage';
import TelemetryPage from './pages/TelemetryPage';
import DeviceSandboxPage from './pages/DeviceSandboxPage';
import DlqPage from './pages/DlqPage';
import ResiliencePage from './pages/ResiliencePage';
import { API_BASE } from './config/api';

const TEMPLATE_PRESETS = {
OTP: {
  channel: 'EMAIL',
  payload: '{\n  "name": "Aditya",\n  "otp": "482910"\n}',
  recipient: 'ops@notifyhub.local',
},
  ORDER_ALERT: {
    channel: 'EMAIL',
    payload: '{\n  "customerName": "Aditya",\n  "orderId": "ORD-2048",\n  "status": "shipped"\n}',
    recipient: 'ops@notifyhub.local',
    template: 'ORDER_ALERT',
    priority: 'MEDIUM',
  },
  PROMO: {
    channel: 'WEBHOOK',
    payload: '{\n  "name": "Aditya",\n  "offer": "20% off"\n}',
    recipient: '',
    template: 'PROMO',
    priority: 'LOW',
  },
};

function normalizeEvent(event) {
  const priorityNames = { 1: 'HIGH', 5: 'MEDIUM', 10: 'LOW' };
  return {
    ...event,
    jobId: event.jobId || '#unknown',
    channel: event.channel || 'EMAIL',
    priority: typeof event.priority === 'number' ? priorityNames[event.priority] || 'MEDIUM' : event.priority || 'MEDIUM',
    status: event.status || 'QUEUED',
    attempts: event.attempts ?? 0,
    maxAttempts: event.maxAttempts ?? 4,
  };
}

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [metrics, setMetrics] = useState({ ingested: 0, queued: 0, deliveryRate: 0, dlq: 0, system: 'HEALTHY' });
  const [pingMs, setPingMs] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventStatuses, setEventStatuses] = useState({});
  const [dlqJobs, setDlqJobs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replayingJobId, setReplayingJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [chaosFlags, setChaosFlags] = useState({});
  const [previewNotification, setPreviewNotification] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [batchJobIds, setBatchJobIds] = useState([]);
  const [batchStartedAt, setBatchStartedAt] = useState(null);
  const [form, setForm] = useState({
    recipient: 'ops@notifyhub.local',
    channel: 'EMAIL',
    priority: 'HIGH',
    template: 'OTP',
    payload: TEMPLATE_PRESETS.OTP.payload,
  });

  const updateMetrics = useCallback(async () => {
    const started = performance.now();
    try {
      const { data } = await axios.get(`${API_BASE}/analytics`);
      setPingMs(Math.round(performance.now() - started));
      setMetrics((current) => ({
        ...current,
        ingested: data.ingested ?? current.ingested,
        queued: data.queued ?? current.queued,
        deliveryRate: data.deliveryRate ?? current.deliveryRate,
        dlq: data.dlq ?? current.dlq,
        system: data.system ?? current.system,
      }));
    } catch (error) {
      setPingMs(null);
      console.error('Unable to refresh analytics:', error);
    }
  }, []);

  const fetchDlq = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/notifications/dlq`);
      setDlqJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Unable to fetch DLQ:', error);
    }
  }, []);

  useEffect(() => {
    updateMetrics();
    fetchDlq();
    const intervalId = setInterval(updateMetrics, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDlq, updateMetrics]);

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/events/stream`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (!payload?.jobId) return;
        const event = normalizeEvent(payload);
        setEvents((current) => [event, ...current.filter((item) => item.jobId !== event.jobId)].slice(0, 100));
        setEventStatuses((current) => ({ ...current, [event.jobId]: event.status }));
        if (event.status === 'DELIVERED') setPreviewNotification(payload);
        if (payload.type === 'dlq') fetchDlq();
        if (event.status === 'FAILED' || event.status === 'DELIVERED') updateMetrics();
      } catch (error) {
        console.error('Unable to parse notification event:', error);
      }
    };
    return () => source.close();
  }, [fetchDlq, updateMetrics]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (name === 'template') {
      const preset = TEMPLATE_PRESETS[value];
      setForm((current) => ({
        ...current,
        template: value,
        channel: preset?.channel || current.channel,
        recipient: preset?.recipient ?? current.recipient,
        payload: preset?.payload || current.payload,
      }));
      setErrorMessage('');
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
  };

  const buildPayload = () => {
    let data;
    try {
      data = form.payload ? JSON.parse(form.payload) : {};
    } catch {
      throw new Error('Payload must be valid JSON.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Payload must be a JSON object.');
    }
    const recipient = form.recipient.trim();
    if (!recipient) throw new Error('Enter a recipient before dispatching.');
    if (form.channel === 'WEBHOOK') {
      let endpoint;
      try {
        endpoint = new URL(recipient);
      } catch {
        throw new Error('Webhook recipient must be a full HTTP(S) endpoint URL.');
      }
      if (!['http:', 'https:'].includes(endpoint.protocol)) {
        throw new Error('Webhook recipient must use HTTP or HTTPS.');
      }
    }
    return {
      recipient,
      channel: form.channel,
      priority: form.priority,
      templateId: form.template,
      data,
    };
  };

  const handleSend = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const requestPayload = buildPayload();
      const { data } = await axios.post(`${API_BASE}/notifications/send`, requestPayload);
      const accepted = normalizeEvent({ ...data, ...requestPayload, status: data.status || 'QUEUED' });
      setEvents((current) => [accepted, ...current.filter((item) => item.jobId !== accepted.jobId)].slice(0, 100));
      await updateMetrics();
      setActivePage('telemetry');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Unable to send notification.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = buildPayload();
      const idempotencyKey = `showcase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await axios.post(`${API_BASE}/notifications/send`, payload, { headers: { 'Idempotency-Key': idempotencyKey } });
      const { data } = await axios.post(`${API_BASE}/notifications/send`, payload, { headers: { 'Idempotency-Key': idempotencyKey } });
      const duplicate = normalizeEvent({ ...data, ...payload, jobId: `${data.jobId} (duplicate)`, status: 'DUPLICATE_IGNORED' });
      setEvents((current) => [duplicate, ...current].slice(0, 100));
      setActivePage('telemetry');
      await updateMetrics();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Idempotency test failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSend = async () => {
    setBatchSending(true);
    setErrorMessage('');
    try {
      const payload = buildPayload();
      const { data } = await axios.post(`${API_BASE}/notifications/batch`, {
        notifications: Array.from({ length: 50 }, () => payload),
      });
      const jobIds = Array.isArray(data.jobIds) ? data.jobIds : [];
      setBatchStartedAt(Date.now());
      setBatchJobIds(jobIds);
      setEventStatuses((current) => ({
        ...current,
        ...Object.fromEntries(jobIds.map((jobId) => [jobId, 'QUEUED'])),
      }));
      await updateMetrics();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Batch ingestion failed.');
    } finally {
      setBatchSending(false);
    }
  };

  const handleReplay = async (jobId) => {
    setReplayingJobId(jobId);
    setErrorMessage('');
    try {
      const { data } = await axios.post(`${API_BASE}/notifications/dlq/${encodeURIComponent(jobId)}/retry`);
      const replayed = normalizeEvent({
        jobId: data.jobId || `${jobId}-retry`,
        recipient: selectedEvent?.recipient,
        channel: selectedEvent?.channel,
        priority: selectedEvent?.priority,
        templateId: selectedEvent?.templateId,
        status: 'QUEUED',
      });
      setEvents((current) => [replayed, ...current.filter((event) => event.jobId !== replayed.jobId)].slice(0, 100));
      setSelectedEvent(null);
      await Promise.all([fetchDlq(), updateMetrics()]);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Unable to replay notification.');
    } finally {
      setReplayingJobId(null);
    }
  };

  const inspectIncident = (job) => {
    setSelectedEvent(normalizeEvent(job));
    setActivePage('telemetry');
  };

  const pageProps = useMemo(() => ({
    overview: <OverviewPage metrics={metrics} events={events} connected={connected} pingMs={pingMs} onNavigate={setActivePage} />,
    dispatch: <DispatchStudioPage
      form={form}
      onChange={handleFormChange}
      onSetForm={setForm}
      onSubmit={handleSend}
      onDuplicate={handleDuplicate}
      onBatch={() => setBatchOpen(true)}
      loading={loading}
      errorMessage={errorMessage}
      onError={setErrorMessage}
    />,
    telemetry: <TelemetryPage
      events={events}
      connected={connected}
      onReplay={handleReplay}
      replaying={Boolean(replayingJobId)}
      selectedEvent={selectedEvent}
      onSelectEvent={setSelectedEvent}
    />,
    devices: <DeviceSandboxPage notification={previewNotification} form={form} />,
    dlq: <DlqPage
      jobs={dlqJobs}
      onReplay={handleReplay}
      replayingJobId={replayingJobId}
      onRefresh={fetchDlq}
      onInspect={inspectIncident}
    />,
    resilience: <ResiliencePage chaosFlags={chaosFlags} onFlagsChange={setChaosFlags} />,
  }), [
    metrics,
    events,
    connected,
    pingMs,
    form,
    loading,
    errorMessage,
    selectedEvent,
    replayingJobId,
    previewNotification,
    dlqJobs,
    chaosFlags,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-text-primary md:flex-row">
      <Sidebar activePage={activePage} onNavigate={setActivePage} dlqCount={metrics.dlq} />
      <div className="min-w-0 flex-1">
        <Header
          activePage={activePage}
          connected={connected}
          pingMs={pingMs}
          dlqCount={metrics.dlq}
          onBatch={() => setBatchOpen(true)}
          chaosFlags={chaosFlags}
          onChaosFlagsChange={setChaosFlags}
        />
        <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {errorMessage && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-failed/20 bg-failed-surface px-3 py-2.5 text-[11px] text-rose-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="flex-1">{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-200/60 hover:text-rose-100" aria-label="Dismiss error"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {pageProps[activePage] || pageProps.overview}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-3 text-[9px] text-text-tertiary">
            <span>NOTIFYHUB <span className="px-1 text-white/10">/</span> DISTRIBUTED DELIVERY GATEWAY</span>
            <span className="mono-data">LOCAL ENVIRONMENT <span className="px-1 text-white/10">·</span> WORKER CONCURRENCY 4</span>
          </footer>
        </main>
      </div>

      <BatchModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onSend={handleBatchSend}
        sending={batchSending}
        jobIds={batchJobIds}
        statuses={eventStatuses}
        startedAt={batchStartedAt}
      />
    </div>
  );
}
