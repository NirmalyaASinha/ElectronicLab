'use client';

import React from 'react';

export default function AdminProjectDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = React.useState<any | null>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [newMemberId, setNewMemberId] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [projRes, membersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch(`/api/projects/${id}/members`),
        ]);
        const projData = await projRes.json().catch(() => ({}));
        if (!mounted) return;
        const p = Array.isArray(projData.data) ? projData.data.find((x: any) => x.id === id) : null;
        setProject(p);
        const membersData = await membersRes.json().catch(() => ({}));
        setMembers(membersData.success ? membersData.data || [] : []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]);

  const handleAddMember = async () => {
    if (!newMemberId) return;
    const res = await fetch(`/api/projects/${id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: newMemberId }) });
    const data = await res.json();
    if (data.success) setMembers((m) => [data.data[0], ...m]);
    setNewMemberId('');
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!project) return <div style={{ padding: 16 }}>Project not found</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>{project.name}</h1>
      <div style={{ color: 'var(--text-secondary)' }}>{project.description}</div>

      <section style={{ marginTop: 16 }}>
        <h3>Members</h3>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="User ID to add" value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} />
          <button onClick={handleAddMember}>Add</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {members.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No members yet</div>
          ) : (
            members.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: 'var(--bg-elevated)', marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(m.user?.name || m.userId || '').charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.user?.name || m.userId}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.user?.email || ''}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={async () => { if (confirm('Remove member?')) { await fetch(`/api/projects/${id}/members/${m.id}`, { method: 'DELETE' }); location.reload(); } }} style={{ padding: '6px 8px' }}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
