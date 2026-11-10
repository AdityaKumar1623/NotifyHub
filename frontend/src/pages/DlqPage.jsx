import { useState } from 'react';
import { AlertTriangle, ChevronRight, LoaderCircle, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

export default function DlqPage({ jobs, onReplay, replayingJobId, onRefresh, onInspect }) {
  const [query, setQuery] = useState('');
  const visible = jobs.filter((job) => [job.jobId, job.recipient, job.channel, job.errorReason].some((value) => String(value || '').toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Reliability</div><h1 className="text-[25px] font-medium tracking-tight text-text-primary">DLQ incidents</h1><p className="mt-1 text-xs text-text-secondary">Review failed notifications and safely re-enqueue them into BullMQ.</p></div>
        <button type="button" onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-2 text-[10px] text-text-secondary transition hover:bg-white/[0.03] hover:text-text-primary"><RefreshCw className="h-3 w-3" />Refresh incidents</button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="luxury-panel rounded-lg p-4"><div className="text-[9px] uppercase tracking-[0.15em] text-text-tertiary">Quarantined jobs</div><div className="mt-2 text-2xl font-light text-text-primary">{jobs.length}</div></div>
        <div className="luxury-panel rounded-lg p-4"><div className="text-[9px] uppercase tracking-[0.15em] text-text-tertiary">Queue destination</div><div className="mono-data mt-3 text-xs text-text-secondary">notification-dlq</div></div>
        <div className="luxury-panel rounded-lg p-4"><div className="text-[9px] uppercase tracking-[0.15em] text-text-tertiary">Recovery</div><div className="mt-2 inline-flex items-center gap-1.5 text-xs text-champagne"><ShieldAlert className="h-3.5 w-3.5" />Operator initiated</div></div>
      </div>

      <section className="luxury-panel overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="inline-flex items-center gap-2 text-[10px] text-text-secondary"><AlertTriangle className="h-3.5 w-3.5 text-rose-300" />Incident queue <span className="mono-data text-text-tertiary">{visible.length}</span></div>
          <label className="relative"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an incident" className="quiet-field w-48 py-1.5 pl-7 pr-2 text-[10px]" /></label>
        </div>
        {visible.length === 0 ? <div className="grid min-h-64 place-content-center text-center"><span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full border border-white/[0.06] text-text-tertiary"><ShieldAlert className="h-4 w-4" /></span><div className="text-xs text-text-secondary">{jobs.length ? 'No matching incidents' : 'No quarantined notifications'}</div><div className="mt-1 text-[10px] text-text-tertiary">{jobs.length ? 'Try another search.' : 'The dead letter queue is clear.'}</div></div> : (
          <div className="divide-y divide-white/[0.05]">
            {visible.map((job) => (
              <article key={job.jobId} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button type="button" onClick={() => onInspect(job)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2"><span className="mono-data text-[11px] text-text-primary">{job.jobId}</span><span className="luxury-status border-failed/20 bg-failed-surface text-rose-300">FAILED</span></div>
                    <div className="mt-1.5 truncate text-[10px] text-text-secondary">{job.channel} <span className="px-1 text-text-tertiary">/</span>{job.recipient}</div>
                  </button>
                  <button type="button" disabled={replayingJobId === job.jobId} onClick={() => onReplay(job.jobId)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.09] px-3 py-2 text-[10px] font-medium text-text-primary transition hover:border-champagne/25 hover:bg-champagne/[0.04] disabled:opacity-50">
                    {replayingJobId === job.jobId ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{replayingJobId === job.jobId ? 'Re-queueing' : 'Re-queue task'}
                  </button>
                </div>
                <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-md border border-white/[0.045] bg-[#07080a] p-3 font-mono text-[10px] leading-5 text-rose-300/85">{job.errorReason || 'Provider stack trace was not recorded.'}</pre>
                <div className="mt-2 flex items-center justify-between">
                  <span className="mono-data text-[9px] text-text-tertiary">{job.attempts || 0} attempts <span className="px-1">·</span>{job.updatedAt ? new Date(job.updatedAt).toLocaleString() : 'time unavailable'}</span>
                  <button type="button" onClick={() => onInspect(job)} className={clsx('inline-flex items-center gap-1 text-[9px] text-text-tertiary transition hover:text-text-primary')}><span>Inspect payload</span><ChevronRight className="h-3 w-3" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
