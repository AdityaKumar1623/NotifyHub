import { useMemo } from 'react';
import { Activity, X } from 'lucide-react';

export default function BatchModal({
  open,
  onClose,
  onSend,
  sending,
  jobIds,
  statuses,
  startedAt,
}) {
  const processed = useMemo(
    () => jobIds.filter((jobId) => ['DELIVERED', 'FAILED'].includes(statuses[jobId])).length,
    [jobIds, statuses]
  );
  const throughput = startedAt && processed
    ? (processed / Math.max((Date.now() - startedAt) / 1000, 0.1)).toFixed(1)
    : '0.0';
  const batchComplete = jobIds.length > 0 && processed === jobIds.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="batch-title">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#111620] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="batch-title" className="text-lg font-semibold text-white">Batch Ingestion Pipeline</h2>
            <p className="mt-1 text-sm text-slate-400">Enqueue 50 notifications through BullMQ addBulk()</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close batch modal"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-700/70 bg-black/20 p-4">
            <div className="section-kicker">Processed</div>
            <div className="mt-1 text-2xl font-bold text-white">{processed} <span className="text-sm font-normal text-slate-500">/ {jobIds.length || 50}</span></div>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-black/20 p-4">
            <div className="flex items-center gap-2 section-kicker"><Activity className="h-3.5 w-3.5" />Throughput</div>
            <div className="mt-1 text-2xl font-bold text-emerald-300">{throughput} <span className="text-sm font-normal text-slate-500">msgs/sec</span></div>
          </div>
        </div>
        <div className="mb-2 flex justify-between text-xs text-slate-400"><span>Batch progress</span><span>Worker concurrency: 4</span></div>
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" style={{ width: `${jobIds.length ? (processed / jobIds.length) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="subtle-action rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Close</button>
          <button onClick={onSend} disabled={sending || (jobIds.length > 0 && !batchComplete)} className="primary-action rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? 'Enqueuing…' : jobIds.length && !batchComplete ? 'Batch running' : 'Batch Send (50 Tasks)'}
          </button>
        </div>
      </div>
    </div>
  );
}
