'use client';

import React from 'react';
import Link from 'next/link';

export default function StudentProjectsPage() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (!mounted) return;
        if (data.success) setProjects(data.data || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading projects…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>My Projects</h1>
      {projects.length === 0 ? (
        <div style={{ marginTop: 12, color: 'var(--text-secondary)' }}>You are not a member of any projects yet.</div>
      ) : (
        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          {projects.map((p) => (
            <div key={p.id} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.description}</div>
                </div>
                <div>
                  <Link href={`/student/projects/${p.id}`}>
                    <button style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none' }}>Open</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
