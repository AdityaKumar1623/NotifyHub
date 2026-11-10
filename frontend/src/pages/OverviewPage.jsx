import { Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle2, Clock3, Radio } from 'lucide-react';
import { clsx } from 'clsx';

function Metric({ label, value, note, icon: Icon, accent }) {
  return (
    <article className="luxury-panel rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-secondary">{label}</div>
          <div className="mt-4 text-3xl font-light tracking-tight text-text-primary">{value}</div>
          <div className="mt-1.5 text-[10px] text-text-tertiary">{note}</div>
        </div>
        <span className={clsx('grid h-8 w-8 place-items-center rounded-md border border-white/[0.05] bg-white/[0.025]', accent)}><Icon className="h-4 w-4" /></span>
      </div>
    </article>
  );
}

function VolumeChart({ events }) {
  const buckets = Array.from({ length: 12 }, () => 0);
  const now = Date.now();
  for (const event of events) {
    const time = new Date(event.createdAt || event.updatedAt || now).getTime();
    const ageMinutes = Math.max(0, Math.floor((now - time) / 60000));
    const bucket = 11 - Math.min(11, ageMinutes);
    buckets[bucket] += 1;
  }
  const max = Math.max(1, ...buckets);
  const points = buckets.map((value, index) => {
    const x = 8 + index * 64;
    const y = 95 - (value / max) * 68;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="luxury-panel rounded-lg p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between">
        <div><div className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-secondary">Recent event volume</div><div className="mt-1 text-xs text-text-tertiary">Events received in the last 12 minutes</div></div>
        <span className="inline-flex items-center gap-1.5 text-[9px] text-text-tertiary"><span className="h-1.5 w-1.5 rounded-full bg-champagne/80" />From SSE history</span>
      </div>
      <div className="h-32 w-full">
        <svg viewBox="0 0 720 112" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Recent event volume trend">
          {[26, 48, 70, 92].map((y) => <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
          <polyline points={points} fill="none" stroke="#D4C4A8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {buckets.map((value, index) => <circle key={index} cx={8 + index * 64} cy={95 - (value / max) * 68} r="2.5" fill="#D4C4A8" />)}
        </svg>
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-text-tertiary"><span>12 min ago</span><span>6 min ago</span><span>now</span></div>
    </div>
  );
}

export default function OverviewPage({ metrics, events, connected, pingMs, onNavigate }) {
  const deliveryRate = `${Number(metrics.deliveryRate || 0).toFixed(2)}%`;
  const recent = events.slice(0, 6);
  const statusColor = {
    DELIVERED: 'text-emerald-400',
    FAILED: 'text-rose-400',
    PROCESSING: 'text-sky-300',
    QUEUED: 'text-champagne-muted',
    DUPLICATE_IGNORED: 'text-violet-300',
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Overview</div><h1 className="text-[25px] font-medium tracking-tight text-text-primary">Health & metrics</h1><p className="mt-1 text-xs text-text-secondary">A measured view of the local notification gateway.</p></div>
        <div className="flex items-center gap-3 text-[10px] text-text-secondary"><span className="inline-flex items-center gap-1.5"><span className={clsx('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-text-tertiary')} />{connected ? 'Event stream connected' : 'Event stream offline'}</span><span className="border-l border-white/[0.07] pl-3">API {pingMs == null ? '—' : `${pingMs}ms`}</span></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Notifications ingested" value={Number(metrics.ingested || 0).toLocaleString()} note="All-time accepted requests" icon={Activity} accent="text-champagne" />
        <Metric label="Active queue depth" value={Number(metrics.queued || 0).toLocaleString()} note="Queued and processing" icon={BellRing} accent="text-sky-300" />
        <Metric label="Delivery success" value={deliveryRate} note="Delivered / ingested" icon={CheckCircle2} accent="text-emerald-400" />
        <Metric label="DLQ incidents" value={Number(metrics.dlq || 0).toLocaleString()} note={metrics.dlq ? 'Requires operator review' : 'No quarantined notifications'} icon={AlertTriangle} accent={metrics.dlq ? 'text-rose-400' : 'text-text-secondary'} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <VolumeChart events={events} />
        <div className="luxury-panel rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><div className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-secondary">Gateway status</div><div className="mt-1 text-xs text-text-tertiary">Runtime indicators</div></div><Radio className="h-4 w-4 text-text-tertiary" /></div>
          <div className="mt-5 space-y-3">
            {[['API reachability', pingMs == null ? 'Unavailable' : 'Responsive', pingMs == null ? 'text-rose-300' : 'text-emerald-300'], ['SSE stream', connected ? 'Connected' : 'Disconnected', connected ? 'text-emerald-300' : 'text-text-secondary'], ['Worker concurrency', '4 configured', 'text-text-primary'], ['Rate limiter', 'Enabled', 'text-text-primary']].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/[0.045] pb-2.5 last:border-0 last:pb-0"><span className="text-[11px] text-text-secondary">{label}</span><span className={clsx('mono-data text-[10px]', tone)}>{value}</span></div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/[0.055] pt-3 text-[10px] text-text-tertiary"><Clock3 className="h-3 w-3" />Metrics refresh every 5 seconds</div>
        </div>
      </section>

      <section className="luxury-panel overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div><div className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-secondary">Recent activity</div><div className="mt-1 text-xs text-text-tertiary">Latest notifications observed on the event stream</div></div>
          <button type="button" onClick={() => onNavigate('telemetry')} className="inline-flex items-center gap-1.5 text-[10px] text-champagne transition hover:text-champagne-light">Open telemetry <ArrowRight className="h-3 w-3" /></button>
        </div>
        {recent.length === 0 ? <div className="px-5 py-10 text-center text-xs text-text-tertiary">No live events yet. Dispatch a notification to begin.</div> : (
          <div className="divide-y divide-white/[0.045]">
            {recent.map((event, index) => (
              <div key={`${event.jobId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_100px_100px] sm:px-5">
                <div className="min-w-0"><div className="mono-data truncate text-[10px] text-text-secondary">{event.jobId}</div><div className="mt-1 truncate text-[10px] text-text-tertiary">{event.recipient || event.channel}</div></div>
                <span className="hidden text-[10px] text-text-secondary sm:block">{event.channel}</span>
                <span className={clsx('text-right text-[10px] font-medium sm:text-left', statusColor[event.status] || 'text-text-secondary')}>{event.status}</span>
                <span className="hidden text-right text-[9px] text-text-tertiary sm:block">{event.createdAt ? new Date(event.createdAt).toLocaleTimeString() : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
