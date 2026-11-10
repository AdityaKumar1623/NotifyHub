import { useEffect, useMemo, useState } from 'react';
import { Battery, Mail, MessageSquare, Signal, Smartphone, Wifi } from 'lucide-react';

const TEMPLATES = {
  OTP: {
    subject: 'Your OTP is {{otp}}',
    body: 'Hello {{name}}, your OTP code is {{otp}}.',
  },
  ORDER_ALERT: {
    subject: 'Order {{orderId}} update',
    body: 'Hi {{customerName}}, your order {{orderId}} is now {{status}}.',
  },
  PROMO: {
    subject: 'Promotional update',
    body: 'New campaign for {{name}}: {{offer}}.',
  },
};

const ALLOWED_TAGS = new Set(['A', 'B', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3', 'I', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'U', 'UL']);

function renderTemplate(text, data) {
  return String(text || '').replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, key) => {
    const value = key.split('.').reduce((result, part) => result?.[part], data);
    return value == null ? '' : String(value);
  });
}

function sanitizeEmailHtml(input) {
  const parsed = new DOMParser().parseFromString(String(input || ''), 'text/html');
  const cleanNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent || ''));
        return;
      }

      [...child.attributes].forEach((attribute) => {
        if (child.tagName !== 'A' || attribute.name !== 'href') {
          child.removeAttribute(attribute.name);
          return;
        }
        try {
          const url = new URL(attribute.value, window.location.origin);
          if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) child.removeAttribute(attribute.name);
          else child.setAttribute('href', url.href);
        } catch {
          child.removeAttribute(attribute.name);
        }
      });
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      cleanNode(child);
    });
  };

  cleanNode(parsed.body);
  return parsed.body.innerHTML;
}

export default function DevicePreview({ notification, form }) {
  const [view, setView] = useState('phone');
  const [bannerVisible, setBannerVisible] = useState(false);
  const draftData = useMemo(() => {
    try {
      return JSON.parse(form?.payload || '{}');
    } catch {
      return {};
    }
  }, [form?.payload]);
  const template = TEMPLATES[form?.template] || { subject: 'Notification', body: 'You have a new notification.' };
  const item = notification || {
    recipient: form?.recipient,
    channel: form?.channel || 'EMAIL',
    templateId: form?.template,
    data: draftData,
    renderedSubject: renderTemplate(template.subject, draftData),
    renderedBody: renderTemplate(template.body, draftData),
    status: 'DRAFT PREVIEW',
  };
  const data = item.data || draftData;
  const subject = item.renderedSubject || renderTemplate(template.subject, data);
  const body = item.renderedBody || renderTemplate(template.body, data);
  const safeHtml = useMemo(() => sanitizeEmailHtml(item.html || `<p>${body}</p>`), [body, item.html]);

  useEffect(() => {
    if (!notification?.jobId) {
      setBannerVisible(true);
      return undefined;
    }
    setBannerVisible(false);
    const timer = setTimeout(() => setBannerVisible(true), 45);
    return () => clearTimeout(timer);
  }, [notification?.jobId]);

  return (
    <div className="flex h-full min-h-[480px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <div>
          <div className="section-label">Virtual runtime</div>
          <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-slate-100">Delivery preview</h2>
        </div>
        <div className="flex items-center rounded-lg border border-white/[0.07] bg-black/20 p-1">
          <button type="button" onClick={() => setView('phone')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${view === 'phone' ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            <Smartphone className="h-3.5 w-3.5" />Device
          </button>
          <button type="button" onClick={() => setView('mail')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${view === 'mail' ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            <Mail className="h-3.5 w-3.5" />Webmail
          </button>
        </div>
      </div>

      {view === 'phone' ? (
        <div className="flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
          <div className="relative w-[252px] rounded-[2.55rem] border border-slate-500/60 bg-[#090b10] p-[7px] shadow-[0_30px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.035)]">
            <div className="relative flex h-[410px] flex-col overflow-hidden rounded-[2.05rem] border border-white/[0.06] bg-[#17202d] px-4 pb-4 pt-3">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(90,123,164,0.24),transparent_65%)]" />
              <div className="relative z-10 flex h-7 items-center justify-between px-1 text-[10px] font-semibold text-white">
                <span>9:41</span>
                <div className="absolute left-1/2 top-1 h-[22px] w-[84px] -translate-x-1/2 rounded-full border border-white/5 bg-black" />
                <span className="flex items-center gap-1"><Signal className="h-3 w-3" /><Wifi className="h-3 w-3" /><Battery className="h-3 w-3" /></span>
              </div>
              <div className="relative z-10 mt-10 text-center">
                <div className="text-[54px] font-light leading-none tracking-[-0.06em] text-white">9:41</div>
                <div className="mt-2 text-[11px] font-medium text-slate-300/80">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className={`relative z-10 mt-9 rounded-[18px] border border-white/10 bg-[#202b38]/90 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-500 ${bannerVisible ? 'animate-slide-down translate-y-0 opacity-100' : '-translate-y-5 opacity-0'}`}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-glow-indigo">
                    {item.channel === 'SMS' ? <MessageSquare className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-semibold tracking-wide text-white">NOTIFYHUB · {item.channel}</div>
                  </div>
                  <span className="self-start text-[9px] text-slate-400">now</span>
                </div>
                <div className="mb-1 truncate text-xs font-semibold text-white">{item.recipient || 'Notification recipient'}</div>
                <p className="text-[11px] leading-[1.55] text-slate-200/85">{body || 'Your notification content will appear here.'}</p>
              </div>
              <div className="relative z-10 mt-auto flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400/80">
                <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'DELIVERED' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {item.status || 'Preview'}
              </div>
            </div>
            <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-white/15" />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[650px] overflow-hidden rounded-xl border border-white/[0.1] bg-[#f7f8fb] text-slate-800 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="flex h-10 items-center gap-1.5 border-b border-slate-200 bg-[#e9ebf0] px-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6058]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <div className="ml-3 flex h-6 flex-1 items-center justify-center rounded-md bg-white/75 text-[9px] text-slate-400">mail.notifyhub.local</div>
            </div>
            <div className="flex min-h-[348px]">
              <aside className="hidden w-28 shrink-0 border-r border-slate-200 bg-[#f0f2f6] p-3 sm:block">
                <div className="mb-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-700"><Mail className="h-3.5 w-3.5 text-indigo-500" /> Mailbox</div>
                <div className="rounded-md bg-indigo-100 px-2 py-1.5 text-[9px] font-semibold text-indigo-700">Inbox <span className="float-right">1</span></div>
                <div className="mt-2 px-2 py-1.5 text-[9px] text-slate-500">Sent</div>
                <div className="px-2 py-1.5 text-[9px] text-slate-500">Drafts</div>
              </aside>
              <div className="min-w-0 flex-1">
                <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Inbox <span className="px-1 text-slate-300">/</span> Message</div>
                  <h3 className="mb-3 text-[16px] font-semibold leading-snug text-slate-800">{subject || 'Notification'}</h3>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">N</div>
                    <div className="min-w-0 text-[10px] leading-relaxed">
                      <div className="font-semibold text-slate-700">NotifyHub Dispatcher <span className="font-normal text-slate-400">&lt;noreply@notifyhub.io&gt;</span></div>
                      <div className="truncate text-slate-500">to {item.recipient || 'recipient@example.com'}</div>
                    </div>
                    <span className="ml-auto shrink-0 text-[9px] text-slate-400">now</span>
                  </div>
                </div>
                <div className="min-h-[205px] overflow-auto px-5 py-5 text-[12px] leading-6 text-slate-700">
                  <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                </div>
                <div className="border-t border-slate-200 px-5 py-2 text-[9px] text-slate-400">
                  Compiled from {item.templateId || form?.template || 'template'} · {item.status || 'PREVIEW'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
