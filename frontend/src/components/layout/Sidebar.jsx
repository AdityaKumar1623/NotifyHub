import {
  Activity,
  AlertTriangle,
  BellRing,
  ChevronRight,
  Command,
  Layers3,
  Radio,
  Send,
  Settings2,
  Smartphone,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { id: 'overview', label: 'Health overview', icon: Activity },
  { id: 'dispatch', label: 'Dispatch studio', icon: Send },
  { id: 'telemetry', label: 'Live telemetry', icon: Radio },
  { id: 'devices', label: 'Device sandbox', icon: Smartphone },
  { id: 'dlq', label: 'DLQ incidents', icon: AlertTriangle },
  { id: 'resilience', label: 'Resilience lab', icon: Settings2 },
];

export const PAGE_TITLES = Object.fromEntries(NAV_ITEMS.map(({ id, label }) => [id, label]));

export default function Sidebar({ activePage, onNavigate, dlqCount = 0 }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-surface-base md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-5">
        <button type="button" onClick={() => onNavigate('overview')} className="group flex items-center gap-3 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-surface-elevated text-champagne"><Zap className="h-4 w-4" /></span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-text-primary">NotifyHub</span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.16em] text-text-tertiary">Gateway engine</span>
          </span>
        </button>
        <span className="hidden items-center gap-1 rounded border border-white/[0.07] px-1.5 py-1 text-[9px] text-text-tertiary md:inline-flex"><Command className="h-3 w-3" /> K</span>
      </div>

      <div className="hidden px-3 pt-2 md:block">
        <div className="mb-2 px-2 text-[9px] font-medium uppercase tracking-[0.16em] text-text-tertiary">Workspace</div>
        <nav className="space-y-0.5" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={activePage === id ? 'page' : undefined}
              className={clsx(
                'group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-xs transition',
                activePage === id
                  ? 'border-white/[0.08] bg-white/[0.04] text-text-primary shadow-sm'
                  : 'border-transparent text-text-secondary hover:bg-white/[0.025] hover:text-text-primary'
              )}
            >
              <Icon className={clsx('h-3.5 w-3.5', activePage === id ? 'text-champagne' : 'text-text-tertiary group-hover:text-text-secondary')} />
              <span className="flex-1">{label}</span>
              {id === 'dlq' && dlqCount > 0 && <span className="mono-data rounded bg-failed-surface px-1.5 py-0.5 text-[9px] text-rose-300">{dlqCount}</span>}
              {activePage === id && <ChevronRight className="h-3 w-3 text-text-tertiary" />}
            </button>
          ))}
        </nav>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={activePage === id ? 'page' : undefined}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-2 text-[10px] transition',
              activePage === id ? 'border-white/[0.08] bg-white/[0.04] text-text-primary' : 'border-transparent text-text-secondary'
            )}
          >
            <Icon className={clsx('h-3.5 w-3.5', activePage === id ? 'text-champagne' : 'text-text-tertiary')} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto hidden p-3 md:block">
        <div className="rounded-lg border border-white/[0.055] bg-surface-elevated p-3">
          <div className="flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Layers3 className="h-3.5 w-3.5 text-champagne/80" />Local environment</div>
          <div className="mono-data mt-2 text-[9px] text-text-tertiary">NOTIFYHUB / DEV</div>
        </div>
        <div className="mt-3 flex items-center justify-between px-2 text-[9px] text-text-tertiary">
          <span className="inline-flex items-center gap-1.5"><BellRing className="h-3 w-3" />Reliability engine</span>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
