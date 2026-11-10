import { useMemo, useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function CodeGenerator({ form }) {
  const [format, setFormat] = useState('curl');
  const [copied, setCopied] = useState(false);
  const snippet = useMemo(() => {
    let data = {};
    try {
      data = JSON.parse(form.payload || '{}');
    } catch {
      data = {};
    }

    const payload = {
      recipient: form.recipient,
      channel: form.channel,
      priority: form.priority,
      templateId: form.template,
      data,
    };
    const json = JSON.stringify(payload, null, 2);
    const singleQuote = (value) => `'${value.replace(/'/g, `'"'"'`)}'`;

    if (format === 'curl') {
      return `curl -X POST ${singleQuote(`${API_BASE}/notifications/send`)} -H 'Content-Type: application/json' -d ${singleQuote(json)}`;
    }
    if (format === 'node') {
      return `const axios = require('axios');\n\naxios.post('${API_BASE}/notifications/send', ${JSON.stringify(payload, null, 2)})\n  .then(({ data }) => console.log(data))\n  .catch((error) => console.error(error.response?.data || error.message));`;
    }
    return `import json\nimport requests\n\npayload = json.loads(${JSON.stringify(JSON.stringify(payload))})\nresponse = requests.post('${API_BASE}/notifications/send', json=payload, timeout=10)\nresponse.raise_for_status()\nprint(response.json())`;
  }, [format, form]);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy snippet:', error);
    }
  };

  return (
    <section className="mt-4 rounded-md border border-white/[0.06] bg-[#0b0c0e] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-champagne" />
          <h3 className="text-xs font-medium text-text-primary">Developer snippet</h3>
        </div>
        <div className="flex gap-1">
          {[['curl', 'cURL'], ['node', 'Node.js'], ['python', 'Python']].map(([value, label]) => (
            <button key={value} onClick={() => setFormat(value)} className={`rounded px-2 py-1 text-[9px] transition ${format === value ? 'bg-white/[0.07] text-text-primary' : 'text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary'}`}>
              {label}
            </button>
          ))}
          <button onClick={copySnippet} className="inline-flex items-center gap-1 rounded border border-white/[0.08] px-2 py-1 text-[9px] text-text-secondary transition hover:bg-white/[0.03] hover:text-text-primary">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded border border-white/[0.045] bg-[#07080a] p-3 font-mono text-[10px] leading-5 text-champagne-light/85"><code>{snippet}</code></pre>
    </section>
  );
}
