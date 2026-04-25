'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [project, setProject] = React.useState<any | null>(null);
  const [components, setComponents] = React.useState<any[]>([]);
    const [availableComponents, setAvailableComponents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [selectedComponent, setSelectedComponent] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [createRequestOption, setCreateRequestOption] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [projRes, compRes] = await Promise.all([
          fetch('/api/projects'),
          fetch(`/api/projects/${id}/components`),
        ]);
        const projData = await projRes.json().catch(() => ({}));
        const compData = await compRes.json().catch(() => ({}));
        if (!mounted) return;
        const p = Array.isArray(projData.data) ? projData.data.find((x: any) => x.id === id) : null;
        setProject(p);
        setComponents(compData.success ? compData.data || [] : []);
        // fetch global components for selection
        try {
          const allRes = await fetch('/api/components');
          const allData = await allRes.json();
          if (allData.data) setAvailableComponents(allData.data.filter((c: any) => c.status !== 'OUT_OF_STOCK'));
        } catch (e) {
          // ignore
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading project…</div>;

  const handleCheckout = async () => {
    if (!selectedComponent) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId: selectedComponent, quantity, createRequest: createRequestOption }),
      });
      const data = await res.json();
      if (data.success) {
        // refresh
        const compRes = await fetch(`/api/projects/${id}/components`);
        const compData = await compRes.json();
        setComponents(compData.success ? compData.data || [] : []);
      } else {
        alert(data.error || 'Failed to checkout');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!project) return <div style={{ padding: 16 }}>Project not found or you don't have access.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>{project.name}</h1>
            <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{project.description}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
        <section style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Project Components</h3>
          <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
            {components.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No components assigned to this project yet.</div>
            ) : (
              components.map((c) => (
                <div key={c.id} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.component?.name ?? c.componentId}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Assigned to: {c.assignedTo || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{c.quantity}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.isReturned ? 'Returned' : 'Checked out'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Checkout Component</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <select value={selectedComponent ?? ''} onChange={(e) => setSelectedComponent(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              <option value="">Select component</option>
              {availableComponents.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — ({c.quantityAvailable} available)</option>
              ))}
            </select>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: 100, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={createRequestOption} onChange={(e) => setCreateRequestOption(e.target.checked)} /> Create request
            </label>
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={handleCheckout} disabled={checkoutLoading || !selectedComponent} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none' }}>{checkoutLoading ? 'Checking out…' : 'Checkout'}</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
