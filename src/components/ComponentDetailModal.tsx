"use client";

import React from "react";

type Props = {
  component: any;
  open: boolean;
  onClose: () => void;
};

export default function ComponentDetailModal({ component, open, onClose }: Props) {
  const [tab, setTab] = React.useState<'details'|'chat'|'datasheet'>('details');
  const [messages, setMessages] = React.useState<{role: 'user'|'assistant'; text: string}[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTab('details');
      setMessages([]);
      setInput('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/components/${component.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      const reply = json?.reply || 'No reply';
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Network error' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[90%] max-w-4xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6 z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{component.name}</h2>
            <div className="text-sm text-[var(--text-secondary)]">{component.category} · {component.modelNumber || ''}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('details')} className={`px-3 py-1 rounded ${tab==='details' ? 'bg-[var(--accent)] text-white' : 'border'}`}>Details</button>
            <button onClick={() => setTab('chat')} className={`px-3 py-1 rounded ${tab==='chat' ? 'bg-[var(--accent)] text-white' : 'border'}`}>Chat</button>
            <button onClick={() => setTab('datasheet')} className={`px-3 py-1 rounded ${tab==='datasheet' ? 'bg-[var(--accent)] text-white' : 'border'}`}>Datasheet</button>
            <button onClick={onClose} className="px-3 py-1 rounded border">Close</button>
          </div>
        </div>

        <div className="mt-4">
          {tab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <div className="w-full h-48 bg-[var(--bg-elevated)] rounded flex items-center justify-center">
                  {component.imageUrl ? <img src={component.imageUrl} alt={component.name} className="max-h-44 object-contain" /> : <span className="text-4xl">📦</span>}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-[var(--text-secondary)]">{component.description}</p>
                <div className="mt-4 text-sm text-[var(--text-muted)]">
                  <div><strong>Available:</strong> {component.quantityAvailable}/{component.quantityTotal}</div>
                  <div><strong>Max issue:</strong> {component.maxIssueQuantity} × {component.maxIssueDays} days</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'datasheet' && (
            <div>
              {component.specs?.datasheetUrl ? (
                <iframe src={component.specs.datasheetUrl} className="w-full h-[600px] border rounded" />
              ) : (
                <div className="p-4 text-sm text-[var(--text-secondary)]">No datasheet URL found for this component.</div>
              )}
            </div>
          )}

          {tab === 'chat' && (
            <div className="flex flex-col h-[420px]">
              <div className="flex-1 overflow-y-auto p-2 space-y-2 border rounded bg-[var(--bg-elevated)]">
                {messages.length === 0 && <div className="text-sm text-[var(--text-secondary)]">Ask about this component — wiring, usage, examples.</div>}
                {messages.map((m, idx) => (
                  <div key={idx} className={`p-2 rounded ${m.role==='user' ? 'bg-white self-end' : 'bg-[var(--bg-base)]'}`}>
                    <div className="text-sm">{m.text}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} placeholder="Ask a question..." className="flex-1 px-3 py-2 border rounded" />
                <button onClick={sendMessage} disabled={loading} className="px-4 py-2 rounded bg-[var(--accent)] text-white">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
