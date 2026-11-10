import { Activity, Smartphone } from 'lucide-react';
import DevicePreview from '../components/DevicePreview';

export default function DeviceSandboxPage({ notification, form }) {
  return (
    <div className="space-y-5">
      <header>
        <div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Simulation</div>
        <h1 className="text-[25px] font-medium tracking-tight text-text-primary">Device sandbox</h1>
        <p className="mt-1 text-xs text-text-secondary">Inspect how the currently selected template resolves across a virtual device and webmail client.</p>
      </header>
      <section className="luxury-panel overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.06] bg-white/[0.025] text-champagne"><Smartphone className="h-4 w-4" /></span><div><div className="text-xs font-medium text-text-primary">Virtual runtime</div><div className="mt-0.5 text-[9px] text-text-tertiary">Live delivery preview</div></div></div>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-text-tertiary"><Activity className="h-3 w-3" />{notification?.status === 'DELIVERED' ? 'Last delivery received' : 'Showing form preview'}</span>
        </div>
        <DevicePreview notification={notification} form={form} />
      </section>
    </div>
  );
}
