 'use client';
import React, { useEffect, useState } from 'react';
import InfoCard from './InfoCard';
import InfoModal from './InfoModal';
import { useSession } from 'next-auth/react';

type Info = {
  id: string;
  title: string;
  content: string;
  pinned?: boolean;
  authorRole?: string;
  createdAt?: string;
};

type Props = {
  allowEdit?: boolean;
};

export default function InformationBoard({ allowEdit = false }: Props) {
  const [items, setItems] = useState<Info[]>([]);
  const [selected, setSelected] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/information?limit=6');
      const json = await res.json();
      if (json?.success) setItems(json.data || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const submit = async () => {
    try {
      const res = await fetch('/api/information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, pinned }),
      });
      const j = await res.json();
      if (j?.success) {
        setTitle(''); setContent(''); setPinned(false); setEditorOpen(false);
        void fetchItems();
      } else {
        alert(j?.error || 'Failed');
      }
    } catch (e) {
      alert('Failed to create notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`/api/information/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j?.success) {
        void fetchItems();
      } else {
        alert(j?.error || 'Failed to delete');
      }
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const handleEdit = (it: Info) => {
    setTitle(it.title || '');
    setContent(it.content || '');
    setPinned(!!it.pinned);
    setEditorOpen(true);
    // mark editing id in state via selected
    setSelected(it);
  };

  const submitEdit = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/information/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, pinned }),
      });
      const j = await res.json();
      if (j?.success) {
        setTitle(''); setContent(''); setPinned(false); setEditorOpen(false); setSelected(null);
        void fetchItems();
      } else {
        alert(j?.error || 'Failed to update');
      }
    } catch (e) {
      alert('Failed to update');
    }
  };

  const pinnedItems = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Information</h3>
        {role === 'ADMIN' || role === 'FACULTY' ? (
          <div>
            <button onClick={() => setEditorOpen(true)} style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none' }}>Add Notice</button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* If no items, show a single boxed message */}
      {items.length === 0 ? (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          No information available.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
          {pinnedItems.map((it) => (
            <InfoCard key={it.id} id={it.id} title={it.title} content={it.content} pinned={it.pinned} authorRole={it.authorRole} createdAt={it.createdAt} onClick={() => setSelected(it)} onEdit={allowEdit ? () => handleEdit(it) : undefined} onDelete={allowEdit ? () => handleDelete(it.id) : undefined} />
          ))}
          {rest.map((it) => (
            <InfoCard key={it.id} id={it.id} title={it.title} content={it.content} pinned={it.pinned} authorRole={it.authorRole} createdAt={it.createdAt} onClick={() => setSelected(it)} onEdit={allowEdit ? () => handleEdit(it) : undefined} onDelete={allowEdit ? () => handleDelete(it.id) : undefined} />
          ))}
        </div>
      )}

      <InfoModal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} content={selected?.content} authorRole={selected?.authorRole} createdAt={selected?.createdAt} />

      {editorOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}>
          <div style={{ width: 'min(720px,96%)', background: 'var(--bg-surface)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
            <h3>Create Notice</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditorOpen(false)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>Cancel</button>
                <button onClick={() => { if (selected) void submitEdit(); else void submit(); }} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white' }}>{selected ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
