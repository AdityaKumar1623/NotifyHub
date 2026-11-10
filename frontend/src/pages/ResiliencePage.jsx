import { AlertTriangle, ShieldCheck } from 'lucide-react';
import ChaosBar from '../components/ChaosBar';

export default function ResiliencePage({ chaosFlags, onFlagsChange }) {
  const enabled = Object.values(chaosFlags || {}).filter(Boolean).length;
  return (
    <div className="space-y-5">
      <header>
        <div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Reliability</div>
        <h1 className="text-[25px] font-medium tracking-tight text-text-primary">Resilience lab</h1>
        <p className="mt-1 text-xs text-text-secondary">Inject controlled provider and worker faults to observe retries, delivery outcomes and DLQ routing.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="luxury-panel flex items-start gap-3 rounded-lg p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.03] text-champagne"><ShieldCheck className="h-4 w-4" /></span><div><div className="text-xs font-medium text-text-primary">Controlled simulation</div><p className="mt-1 text-[10px] leading-5 text-text-secondary">Fault flags are stored in Redis and affect newly processed jobs. Disable a fault to return to normal dispatch behavior.</p></div></div>
        <div className="luxury-panel flex items-start gap-3 rounded-lg p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-failed-surface text-rose-300"><AlertTriangle className="h-4 w-4" /></span><div><div className="text-xs font-medium text-text-primary">{enabled} active fault{enabled === 1 ? '' : 's'}</div><p className="mt-1 text-[10px] leading-5 text-text-secondary">Failures retry with exponential backoff; jobs that exhaust attempts are moved to the dead letter queue.</p></div></div>
      </div>

      <section className="luxury-panel overflow-hidden rounded-lg">
        <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5"><div className="text-[9px] uppercase tracking-[0.16em] text-text-tertiary">Fault controls</div><h2 className="mt-1 text-sm font-medium text-text-primary">Choose a simulation</h2></div>
        <div className="p-4 sm:p-5"><ChaosBar flags={chaosFlags} onFlagsChange={onFlagsChange} initialExpanded compact /></div>
      </section>

      <p className="text-[10px] leading-5 text-text-tertiary">Run simulations only against your local or otherwise authorized environment. Avoid using real recipients for fault-injection demos.</p>
    </div>
  );
}
