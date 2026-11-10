import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config/api';
const LABELS = {
  CHAOS_FORCE_EMAIL_FAILURE: 'Force email provider 503',
  CHAOS_INJECT_LATENCY: 'Inject 2s worker latency',
  CHAOS_DROP_SMS: 'Drop SMS (carrier timeout)',
};

export default function ChaosBar({ flags, onFlagsChange, initialExpanded = false, compact = false }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_BASE}/chaos/status`)
      .then(({ data }) => {
        if (mounted) onFlagsChange(data.flags || {});
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.error || 'Unable to load chaos state');
      });
    return () => { mounted = false; };
  }, [onFlagsChange]);

  const toggle = async (flag) => {
    setUpdating(flag);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/chaos/toggle`, {
        flag,
        enabled: !flags[flag],
      });
      onFlagsChange(data.flags || {});
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <section className={compact ? 'w-full min-w-0' : 'mb-4 w-full min-w-0 overflow-hidden rounded-lg border border-white/[0.07] bg-[#111317]'}>
      {!compact && (
        <button onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
          <span className="flex items-center gap-2 font-semibold text-slate-100"><span className="grid h-8 w-8 place-items-center rounded-lg border border-amber-300/15 bg-amber-300/[0.07] text-amber-200"><Settings2 className="h-4 w-4" /></span>Chaos controls</span>
          <span className="flex items-center gap-3 text-xs text-slate-400">
            {Object.values(flags).filter(Boolean).length} active
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
      )}
      {expanded && (
        <div className={`w-full min-w-0 space-y-2 ${compact ? 'p-0' : 'border-t border-white/[0.06] p-4'}`}>
          {Object.entries(LABELS).map(([flag, label]) => (
            <label key={flag} className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-4 rounded-md border border-white/[0.06] bg-black/10 px-3 py-2.5 transition hover:bg-white/[0.025]">
              <span className="min-w-0 flex-1 break-words text-[11px] leading-5 text-[#c7c8ca]">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(flags[flag])}
                disabled={Boolean(updating)}
                onChange={() => toggle(flag)}
                className="h-4 w-4 shrink-0 accent-[#d4c4a8]"
                aria-label={label}
              />
            </label>
          ))}
          {error && <div className="flex min-w-0 items-start gap-2 text-[10px] leading-5 text-rose-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-words">{error}</span></div>}
          <p className="text-[9px] leading-4 text-[#686d76]">Faults affect newly processed jobs. Failed jobs retry with exponential backoff and may move to the DLQ.</p>
        </div>
      )}
    </section>
  );
}
