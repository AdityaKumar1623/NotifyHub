import { useEffect, useRef, useState } from 'react';
import { Activity, ChevronRight, Layers3, ShieldCheck, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { PAGE_TITLES } from './Sidebar';
import ChaosBar from '../ChaosBar';

export default function Header({
  activePage,
  connected,
  pingMs,
  dlqCount,
  onBatch,
  chaosFlags,
  onChaosFlagsChange,
}) {
  const [chaosOpen, setChaosOpen] = useState(false);
  const containerRef = useRef(null);
  const activeFaults = Object.values(chaosFlags || {}).filter(Boolean).length;

  useEffect(() => {
    if (!chaosOpen) return undefined;
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setChaosOpen(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [chaosOpen]);

  return (
    <header className="luxury-panel-glass sticky top-0 z-40 flex min-h-[58px] items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="hidden text-text-tertiary sm:inline">Gateway Engine</span>
        <ChevronRight className="hidden h-3 w-3 text-text-tertiary sm:inline" />
        <span className="truncate font-medium text-text-primary">{PAGE_TITLES[activePage] || 'Overview'}</span>
        {activePage === 'dlq' && dlqCount > 0 && <span className="mono-data rounded border border-failed/20 bg-failed-surface px-1.5 py-0.5 text-[9px] text-rose-300">{dlqCount}</span>}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 text-[10px] text-text-secondary sm:flex">
          <span className="inline-flex items-center gap-1.5"><span className={clsx('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-500' : 'bg-text-tertiary')} />{connected ? 'Cluster healthy' : 'Stream offline'}</span>
          <span className="hidden items-center gap-1.5 border-l border-white/[0.07] pl-3 lg:inline-flex"><Activity className="h-3 w-3 text-text-tertiary" />{pingMs == null ? '—' : `${pingMs}ms`}</span>
          <span className="hidden items-center gap-1.5 border-l border-white/[0.07] pl-3 xl:inline-flex"><Layers3 className="h-3 w-3 text-text-tertiary" />4 workers configured</span>
        </div>
        <div className="relative" ref={containerRef}>
          <button type="button" onClick={() => setChaosOpen((open) => !open)} className={clsx('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] transition active:scale-[0.99]', activeFaults ? 'border-champagne/25 bg-champagne/[0.07] text-champagne-light' : 'border-white/[0.08] text-text-secondary hover:bg-white/[0.035] hover:text-text-primary')}>
            <Zap className="h-3 w-3" /><span className="hidden sm:inline">Resilience</span>{activeFaults > 0 && <span className="mono-data text-[9px]">{activeFaults}</span>}
          </button>
          {chaosOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(90vw,340px)] rounded-lg border border-white/[0.09] bg-surface-overlay p-3 shadow-xl">
              <div className="mb-3 flex items-start justify-between">
                <div><div className="text-[9px] uppercase tracking-[0.16em] text-text-tertiary">Resilience controls</div><div className="mt-1 text-xs font-medium text-text-primary">Fault injection</div></div>
                <ShieldCheck className="h-4 w-4 text-champagne/80" />
              </div>
              <ChaosBar flags={chaosFlags} onFlagsChange={onChaosFlagsChange} initialExpanded compact />
            </div>
          )}
        </div>
        <button type="button" onClick={onBatch} className="inline-flex items-center gap-1.5 rounded-md bg-champagne-light px-2.5 py-1.5 text-[10px] font-medium text-surface-base transition hover:bg-champagne active:scale-[0.99]"><Layers3 className="h-3 w-3" /><span className="hidden sm:inline">Quick batch</span><span className="sm:hidden">Batch</span></button>
      </div>
    </header>
  );
}
