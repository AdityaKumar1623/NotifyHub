import { useState } from 'react';
import { Code2, Copy, Layers3, Mail, MessageSquare, Send, Webhook, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import CodeGenerator from '../components/CodeGenerator';

const CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'SMS', label: 'SMS', icon: MessageSquare },
  { value: 'WEBHOOK', label: 'Webhook', icon: Webhook },
];
const PRIORITIES = [
  { value: 'HIGH', label: 'High', code: 'P1', active: 'border-rose-500/20 bg-rose-500/[0.07] text-rose-300' },
  { value: 'MEDIUM', label: 'Normal', code: 'P5', active: 'border-white/[0.12] bg-white/[0.05] text-text-primary' },
  { value: 'LOW', label: 'Low', code: 'P10', active: 'border-white/[0.1] bg-white/[0.035] text-text-secondary' },
];
const TEMPLATE_OPTIONS = [
  ['OTP', 'OTP verification'],
  ['ORDER_ALERT', 'Order alert'],
  ['PROMO', 'Promotion'],
];

export default function DispatchStudioPage({
  form,
  onChange,
  onSetForm,
  onSubmit,
  onDuplicate,
  onBatch,
  loading,
  errorMessage,
  onError,
}) {
  const [tab, setTab] = useState('compose');

  const formatPayload = () => {
    try {
      onSetForm((current) => ({ ...current, payload: JSON.stringify(JSON.parse(current.payload || '{}'), null, 2) }));
    } catch {
      onError('Payload must be valid JSON before formatting.');
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-tertiary">Workspace / Dispatch</div>
        <h1 className="text-[25px] font-medium tracking-tight text-text-primary">Dispatch studio</h1>
        <p className="mt-1 text-xs text-text-secondary">Compose a message, choose a delivery channel and enqueue it for processing.</p>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
        <section className="luxury-panel overflow-hidden rounded-lg">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <div><div className="text-[9px] uppercase tracking-[0.16em] text-text-tertiary">Composer</div><h2 className="mt-1 text-sm font-medium text-text-primary">New notification</h2></div>
            <span className="mono-data text-[9px] text-text-tertiary">POST /notifications/send</span>
          </div>
          <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
            <div className="inline-flex rounded-md border border-white/[0.06] bg-black/15 p-0.5">
              {[['compose', Send, 'Compose'], ['batch', Layers3, 'Batch · 50']].map(([id, Icon, label]) => (
                <button type="button" key={id} onClick={() => id === 'batch' ? onBatch() : setTab(id)} className={clsx('inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[10px] transition', tab === id ? 'bg-white/[0.07] text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}>
                  <Icon className="h-3 w-3" />{label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5">
            <div>
              <label htmlFor="dispatch-recipient" className="mb-1.5 block text-[10px] font-medium text-text-secondary">Recipient</label>
              <input id="dispatch-recipient" name="recipient" value={form.recipient} onChange={onChange} className="quiet-field w-full px-3 py-2.5 text-xs placeholder:text-text-tertiary" placeholder={form.channel === 'WEBHOOK' ? 'https://your-webhook-endpoint' : 'name@company.com or +1…'} />
              {form.channel === 'WEBHOOK' && <p className="mt-1.5 text-[10px] text-champagne-muted">Provide a reachable HTTP(S) URL that accepts POST requests.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-text-secondary">Delivery channel</label>
              <div className="grid grid-cols-3 gap-1 rounded-md border border-white/[0.06] bg-black/15 p-1">
                {CHANNELS.map(({ value, label, icon: Icon }) => (
                  <button type="button" key={value} onClick={() => onSetForm((current) => ({ ...current, channel: value }))} className={clsx('inline-flex items-center justify-center gap-1.5 rounded px-2 py-2 text-[10px] transition active:scale-[0.99]', form.channel === value ? 'bg-white/[0.075] text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="dispatch-template" className="mb-1.5 block text-[10px] font-medium text-text-secondary">Template</label>
                <select id="dispatch-template" name="template" value={form.template} onChange={onChange} className="quiet-field w-full appearance-none px-3 py-2.5 text-xs">
                  {TEMPLATE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-text-secondary">Priority</label>
                <div className="flex gap-1">
                  {PRIORITIES.map((item) => (
                    <button type="button" key={item.value} onClick={() => onSetForm((current) => ({ ...current, priority: item.value }))} className={clsx('flex-1 rounded-md border px-1.5 py-2 text-[9px] transition', form.priority === item.value ? item.active : 'border-white/[0.06] text-text-tertiary hover:bg-white/[0.025] hover:text-text-secondary')}>
                      <span className="mono-data mr-1 opacity-70">{item.code}</span>{item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="dispatch-payload" className="text-[10px] font-medium text-text-secondary">Template data</label>
                <button type="button" onClick={formatPayload} className="inline-flex items-center gap-1 text-[9px] text-text-tertiary transition hover:text-champagne"><Copy className="h-3 w-3" />Format JSON</button>
              </div>
              <div className="overflow-hidden rounded-md border border-white/[0.07] bg-[#090a0c] focus-within:border-champagne/30">
                <div className="flex h-8 items-center justify-between border-b border-white/[0.05] px-3">
                  <span className="text-[9px] text-text-tertiary">Payload editor</span><span className="mono-data text-[9px] text-text-tertiary">JSON</span>
                </div>
                <textarea id="dispatch-payload" name="payload" value={form.payload} onChange={onChange} rows={9} spellCheck="false" className="mono-data w-full resize-y bg-transparent px-3 py-3 text-[11px] leading-[1.7] text-champagne-light/90 outline-none" />
              </div>
            </div>

            {errorMessage && <div role="alert" className="rounded-md border border-rose-500/15 bg-rose-500/[0.06] px-3 py-2 text-[11px] text-rose-300">{errorMessage}</div>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-champagne-light px-4 py-2.5 text-xs font-medium text-surface-base transition hover:bg-champagne active:scale-[0.99] disabled:opacity-60">
                <Zap className="h-3.5 w-3.5" />{loading ? 'Enqueuing…' : 'Fire notification'}
              </button>
              <button type="button" onClick={onDuplicate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/[0.08] px-3 py-2.5 text-[10px] text-text-secondary transition hover:bg-white/[0.03] hover:text-text-primary disabled:opacity-60">
                <Copy className="h-3.5 w-3.5" />Idempotency test
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-3">
          <div className="luxury-panel rounded-lg p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><Code2 className="h-3.5 w-3.5 text-champagne" /><div><div className="text-[9px] uppercase tracking-[0.16em] text-text-tertiary">Developer tools</div><h2 className="mt-0.5 text-xs font-medium text-text-primary">Request snippet</h2></div></div>
            <p className="mb-3 text-[10px] leading-5 text-text-secondary">Copy an executable request built from the current form values.</p>
            <CodeGenerator form={form} />
          </div>
          <div className="luxury-panel rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-text-secondary"><Layers3 className="h-3.5 w-3.5 text-champagne" />Async delivery pipeline</div>
            <p className="text-[10px] leading-5 text-text-tertiary">Requests are persisted and queued for worker processing. Provider failures use exponential retries and may be quarantined in the DLQ.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
