'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminProjects() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (!mounted) return;
        if (data.success) setProjects(data.data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    if (!name) return;
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) setProjects((p) => [data.data[0], ...p]);
    setName('');
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Projects</h1>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New project name" />
        <button onClick={handleCreate} style={{ padding: '6px 10px' }}>Create</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {loading ? <div>Loading…</div> : projects.map((p) => (
          <div key={p.id} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{p.description}</div>
            </div>
            <div>
              <Link href={`/admin/projects/${p.id}`}><button style={{ padding: '6px 10px' }}>Open</button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
