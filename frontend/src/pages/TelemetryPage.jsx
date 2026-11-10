import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ChevronRight, Clock3, Database, LoaderCircle, Mail, MessageSquare, Radio, RefreshCw, Search, Terminal, Webhook, X } from 'lucide-react';
import { clsx } from 'clsx';

const CHANNEL_ICONS = { EMAIL: Mail, SMS: MessageSquare, WEBHOOK: Webhook };

function State({ status }) {
  const tone = {
    DELIVERED: 'border-delivered-border bg-delivered-surface text-emerald-300',
    QUEUED: 'border-champagne-muted/20 bg-champagne-muted/[0.07] text-champagne-muted',
    PROCESSING: 'border-processing/20 bg-processing-surface text-sky-300',
    FAILED: 'border-failed/25 bg-failed-surface text-rose-300',
    DUPLICATE_IGNORED: 'border-violet-500/20 bg-violet-500/[0.07] text-violet-300',
  }[status] || 'border-white/[0.07] bg-white/[0.025] text-text-tertiary';
  return <span className={clsx('luxury-status', tone)}>{status === 'DUPLICATE_IGNORED' ? 'IDEMPOTENT HIT' : status || 'UNKNOWN'}</span>;
}

function Drawer({ event, onClose, onReplay, replaying }) {
  useEffect(() => {
    if (!event) return undefined;
    const handler = (keyEvent) => keyEvent.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [event, onClose]);
  if (!event) return null;

  const data = event.data || event.originalJob?.data || {};
  const receipt = event.providerResponse || {};
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px]" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <aside className="animate-drawer-in luxury-panel-glass absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col border-y-0 border-r-0 shadow-drawer" aria-label="Event inspector">
        <div className="hairline-bottom flex items-start justify-between px-5 py-5">
          <div className="min-w-0">
            <div className="mb-1.5 text-[9px] uppercase tracking-[0.17em] text-text-tertiary">Event inspector</div>
            <h2 className="mono-data truncate text-xs text-text-primary">{event.jobId}</h2>
            <div className="mt-2 flex items-center gap-2"><State status={event.status} /><span className="mono-data text-[9px] text-text-tertiary">{event.channel}</span></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-text-tertiary hover:bg-white/[0.04] hover:text-text-primary" aria-label="Close inspector"><X className="h-4 w-4" /></button>
        </div>
        <div className="luxury-scroll flex-1 space-y-5 overflow-y-auto p-5">
          <section>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Activity className="h-3.5 w-3.5 text-champagne" />Execution</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Recipient', event.recipient || '—'],
                ['Priority', String(event.priority || '—')],
                ['Template', event.templateId || '—'],
                ['Attempts', `${event.attempts ?? 0} / ${event.maxAttempts ?? 4}`],
              ].map(([label, value]) => <div key={label} className="rounded-md border border-white/[0.055] bg-black/10 p-3"><div className="mb-1 text-[9px] uppercase tracking-wider text-text-tertiary">{label}</div><div className="break-all text-[10px] text-text-primary">{value}</div></div>)}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-white/[0.055] bg-black/10 p-3"><Clock3 className="h-3.5 w-3.5 text-text-tertiary" /><span className="text-[10px] text-text-secondary">End-to-end timing is not currently emitted by the worker.</span></div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Database className="h-3.5 w-3.5 text-champagne" />Request payload</div>
            <pre className="luxury-scroll max-h-64 overflow-auto rounded-md border border-white/[0.06] bg-[#08090b] p-3 font-mono text-[10px] leading-5 text-champagne-light/85">{JSON.stringify({ recipient: event.recipient, channel: event.channel, priority: event.priority, templateId: event.templateId, data }, null, 2)}</pre>
          </section>

          {event.errorReason && <section><div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />Provider error</div><pre className="whitespace-pre-wrap break-words rounded-md border border-failed/20 bg-failed-surface p-3 font-mono text-[10px] leading-5 text-rose-200/90">{event.errorReason}</pre></section>}

          <section>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Terminal className="h-3.5 w-3.5 text-champagne" />Provider receipt</div>
            <pre className="luxury-scroll max-h-52 overflow-auto rounded-md border border-white/[0.06] bg-[#08090b] p-3 font-mono text-[10px] leading-5 text-emerald-200/80">{JSON.stringify(receipt, null, 2)}</pre>
          </section>

          {(event.renderedSubject || event.renderedBody) && <section><div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Mail className="h-3.5 w-3.5 text-champagne" />Resolved template</div><div className="rounded-md border border-white/[0.06] bg-[#f7f7f5] p-4 text-slate-800"><div className="border-b border-slate-200 pb-2 text-xs font-semibold">{event.renderedSubject}</div><div className="whitespace-pre-wrap pt-3 text-[11px] leading-5">{event.renderedBody}</div></div></section>}
        </div>
        <div className="border-t border-white/[0.06] p-4">
          {event.status === 'FAILED' ? <button type="button" onClick={() => onReplay(event.jobId)} disabled={replaying} className="flex w-full items-center justify-center gap-2 rounded-md border border-failed/25 bg-failed-surface px-4 py-2.5 text-xs font-medium text-rose-200 transition hover:bg-rose-900/20 disabled:opacity-50">{replaying ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{replaying ? 'Re-queueing…' : 'Re-queue task'}</button> : <div className="text-center text-[10px] text-text-tertiary">Replay is available for failed notifications.</div>}
        </div>
      </aside>
    </div>
  );
}

export default function TelemetryPage({ events, connected, onReplay, replaying, selectedEvent: externalSelected, onSelectEvent }) {
  const [query, setQuery] = useState('');
  const [localSelected, setLocalSelected] = useState(null);
  const selected = externalSelected || localSelected;
  const selectEvent = onSelectEvent || setLocalSelected;
  const closeDrawer = () => {
    if (onSelectEvent) onSelectEvent(null);
    else setLocalSelected(null);
  };
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? events.filter((event) => [event.jobId, event.channel, event.status, event.recipient, event.templateId].some((value) => String(value || '').toLowerCase().includes(search))) : events;
  }, [events, query]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Gateway Engine</div><h1 className="text-[25px] font-medium tracking-tight text-text-primary">Live telemetry</h1><p className="mt-1 text-xs text-text-secondary">Notification lifecycle events delivered over Server-Sent Events.</p></div>
        <span className={clsx('luxury-status', connected ? 'border-delivered-border bg-delivered-surface text-emerald-300' : 'border-white/[0.08] text-text-secondary')}><span className={clsx('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-text-tertiary')} />{connected ? 'STREAM CONNECTED' : 'RECONNECTING'}</span>
      </header>

      <section className="luxury-panel overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[10px] text-text-secondary"><Radio className="h-3.5 w-3.5 text-champagne" /><span>Event log</span><span className="text-text-tertiary">/</span><span className="mono-data text-text-tertiary">{filtered.length} records</span></div>
          <label className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by job, channel, status…" className="quiet-field w-[230px] rounded-md py-2 pl-8 pr-3 text-[10px] placeholder:text-text-tertiary" />
          </label>
        </div>
        <div className="luxury-scroll max-h-[calc(100vh-250px)] min-h-[360px] overflow-auto">
          <table className="w-full min-w-[790px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-elevated">
              <tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[0.14em] text-text-tertiary">
                <th className="px-4 py-3 font-medium">Job / Recipient</th><th className="px-3 py-3 font-medium">Channel</th><th className="px-3 py-3 font-medium">Priority</th><th className="px-3 py-3 font-medium">Attempts</th><th className="px-3 py-3 font-medium">State</th><th className="px-3 py-3 font-medium">Received</th><th className="w-8 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="7" className="px-4 py-16 text-center"><div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full border border-white/[0.06] text-text-tertiary"><Radio className="h-4 w-4" /></div><div className="text-xs text-text-secondary">{events.length ? 'No matching events' : 'Waiting for stream events'}</div><div className="mt-1 text-[10px] text-text-tertiary">Events will appear here as notifications move through the gateway.</div></td></tr> : filtered.map((event) => {
                const Icon = CHANNEL_ICONS[event.channel] || Activity;
                return (
                  <tr key={event.jobId} onClick={() => selectEvent(event)} className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                    <td className="max-w-[250px] px-4 py-3"><div className="mono-data truncate text-[10px] text-text-secondary">{event.jobId}</div><div className="mt-1 truncate text-[10px] text-text-tertiary">{event.recipient || event.templateId || '—'}</div></td>
                    <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-text-secondary"><Icon className="h-3 w-3 text-text-tertiary" />{event.channel}</span></td>
                    <td className="mono-data px-3 py-3 text-[10px] text-text-secondary">{event.priority || '—'}</td>
                    <td className="mono-data px-3 py-3 text-[10px] text-text-secondary">{event.attempts ?? 0}<span className="text-text-tertiary">/{event.maxAttempts ?? 4}</span></td>
                    <td className="px-3 py-3"><State status={event.status} /></td>
                    <td className="px-3 py-3 text-[10px] text-text-tertiary">{event.createdAt ? new Date(event.createdAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-2 py-3 text-text-tertiary"><ChevronRight className="h-3.5 w-3.5" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-2 text-[9px] text-text-tertiary"><span>Click a row to inspect the event</span><span className="mono-data inline-flex items-center gap-1"><Radio className="h-3 w-3" />{connected ? 'SSE / LIVE' : 'SSE / OFFLINE'}</span></div>
      </section>
      <Drawer event={selected} onClose={closeDrawer} onReplay={onReplay} replaying={replaying} />
    </div>
  );
}
