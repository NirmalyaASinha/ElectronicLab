"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { Plus, X } from 'lucide-react';

export default function StudentProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [memberInput, setMemberInput] = React.useState('');
  const [members, setMembers] = React.useState<{ id?: string; label: string; email?: string }[]>([]);
  const [memberType, setMemberType] = React.useState<'BOTH'|'STUDENT'|'FACULTY'>('BOTH');
  const [componentInput, setComponentInput] = React.useState('');
  const [componentsList, setComponentsList] = React.useState<any[]>([]);
  const [selectedComponents, setSelectedComponents] = React.useState<{ id: string; name?: string; quantity: number }[]>([]);
  const [driveLinks, setDriveLinks] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const prevFocusRef = React.useRef<HTMLElement | null>(null);
  const [isNarrow, setIsNarrow] = React.useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  const [compDropdownOpen, setCompDropdownOpen] = React.useState(false);
  const [compSearch, setCompSearch] = React.useState('');
  const [memberSuggestions, setMemberSuggestions] = React.useState<{ id?: string; label: string; email?: string }[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);

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

  React.useEffect(() => {
    let mounted = true;
    async function loadComponents() {
      try {
        const res = await fetch('/api/components');
        const data = await res.json();
        if (!mounted) return;
        if (data.success) setComponentsList(data.data || []);
      } catch (e) {
        // ignore
      }
    }
    void loadComponents();
    return () => { mounted = false };
  }, []);

  React.useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < 900);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // modal accessibility: autofocus, ESC-to-close, and basic focus trap
  React.useEffect(() => {
    if (!modalOpen) return;
    const modal = modalRef.current;
    prevFocusRef.current = document.activeElement as HTMLElement | null;

    // focus first focusable element inside modal
    const focusable = modal?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable && focusable.length ? focusable[0] : null;
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalOpen(false);
        return;
      }
      if (e.key === 'Tab' && modal && focusable && focusable.length) {
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // restore previous focus
      try { prevFocusRef.current?.focus(); } catch (e) { /* ignore */ }
    };
  }, [modalOpen]);

  // member autocomplete: query students and faculty endpoints
  React.useEffect(() => {
    let mounted = true;
    async function fetchSuggestions() {
      const q = memberInput.trim();
      if (!q) { if (mounted) setMemberSuggestions([]); return; }
      try {
        const params = new URLSearchParams();
        params.set('query', q);
        if (memberType === 'STUDENT' || memberType === 'FACULTY') params.set('role', memberType);
        params.set('limit', '50');
        const res = await fetch('/api/users/search?' + params.toString());
        const json = await res.json();
        const list = (json && Array.isArray(json.data)) ? json.data.map((u: any) => ({ id: u.id, label: u.name || u.email || u.id, email: u.email })) : [];
        if (mounted) setMemberSuggestions(list.slice(0, 50));
      } catch (e) {
        if (mounted) setMemberSuggestions([]);
      }
    }
    const t = setTimeout(() => { void fetchSuggestions(); }, 200);
    return () => { clearTimeout(t); mounted = false; };
  }, [memberInput, memberType]);

  const canCreate = session && (session.user?.role === 'STUDENT' || session.user?.role === 'FACULTY' || session.user?.role === 'ADMIN');

  const handleCreate = async () => {
    if (!name) return;
    setCreating(true);
    setErrorMessage(null);
    try {
      const combinedDescription = [description, driveLinks ? `Links:\n${driveLinks}` : ''].filter(Boolean).join('\n\n');
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: combinedDescription }) });
      const data = await res.json();
      if (data.success) {
        const created = Array.isArray(data.data) ? data.data[0] : data.data;
        const projectId = created?.id || created?.projectId || created?.project_id || null;
        console.log('Created project id:', projectId, 'raw response:', created);
        if (!projectId) {
          console.warn('Created project missing id', created);
        } else {
          // add members if provided (comma-separated user ids)
          const memberIds = memberInput.split(',').map(s => s.trim()).filter(Boolean);
          for (const uid of memberIds) {
            try {
              await fetch(`/api/projects/${projectId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid }) });
            } catch (e) {
              // ignore member add failures
            }
          }

          // add components if provided (format: componentId:quantity, comma separated)
          const comps = componentInput.split(',').map(s => s.trim()).filter(Boolean);
          for (const c of comps) {
            const [componentId, qtyStr] = c.split(':').map(x => x.trim());
            const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;
            try {
              await fetch(`/api/projects/${projectId}/components`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ componentId, quantity }) });
            } catch (e) {
              // ignore component add failures
            }
          }
        }

        // refresh list
        setProjects(prev => [created, ...prev]);
        setName(''); setDescription(''); setMemberInput(''); setComponentInput(''); setDriveLinks('');
        setModalOpen(false);
      } else {
        setErrorMessage(data.error || 'Failed to create project');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-4">Loading projects…</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Projects</h1>
          {canCreate && (
            <button onClick={() => setModalOpen(true)} aria-label="Create project" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[var(--accent)] text-white">
              <Plus size={16} />
            </button>
          )}
        </div>

        {canCreate && modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-3xl mx-4">
              <div ref={modalRef} role="dialog" aria-modal="true" className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <button onClick={() => setModalOpen(false)} className="absolute right-3 top-3 p-2 rounded-md text-[var(--text-secondary)] bg-transparent"><X size={18} /></button>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', alignItems: 'start' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            </div>

            {/* Members column */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>Members</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                  {members.map((m) => (
                    <div key={m.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13 }}>{m.label}{m.email ? ` — ${m.email}` : ''}</div>
                      <button onClick={() => setMembers(prev => prev.filter(x => x.label !== m.label))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative', minWidth: 220, flex: '0 0 220px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={memberType} onChange={(e) => { setMemberType(e.target.value as any); setMemberInput(''); setMemberSuggestions([]); }} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', minWidth: 120 }}>
                      <option value="BOTH">All</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="STUDENT">Students</option>
                    </select>
                    <input value={memberInput} onChange={(e) => { setMemberInput(e.target.value); setSuggestionsOpen(true); }} onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const v = memberInput.trim();
                      if (v) setMembers(prev => Array.from(new Map([...prev.map(m=>[m.label,m]), [v,{ label: v }]]).values()));
                      setMemberInput(''); setSuggestionsOpen(false);
                    } else if (e.key === 'Backspace' && memberInput === '') {
                      // remove last
                      setMembers(prev => prev.slice(0, Math.max(0, prev.length - 1)));
                    }
                  }} placeholder="Search name or email" style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }} />
                  </div>
                  {suggestionsOpen && memberSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 300 }}>
                      {memberSuggestions.map((s) => (
                        <div key={s.label + (s.id||s.email||'')} onMouseDown={(e) => { e.preventDefault(); setMembers(prev => Array.from(new Map([...prev.map(m=>[m.label,m]), [s.label,s]]).values())); setMemberInput(''); setSuggestionsOpen(false); }} style={{ padding: 8, borderBottom: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <div style={{ fontWeight: 700 }}>{s.label}</div>
                          {s.email && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Components column */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>Components</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div onClick={() => { setCompDropdownOpen(!compDropdownOpen); }} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', cursor: 'pointer' }}>
                    <div style={{ color: componentInput ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{componentInput ? (componentsList.find(c=>c.id===componentInput)?.name || componentInput) : 'Select component...'}</div>
                    <div style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>▾</div>
                  </div>

                  {compDropdownOpen && (
                    <div style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, background: 'rgba(10,12,18,0.98)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, maxHeight: 280, overflowY: 'auto', zIndex: 400 }}>
                      <div style={{ padding: 8 }}>
                        <input placeholder="Filter components..." value={compSearch} onChange={(e) => setCompSearch(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        {componentsList.filter(c => !compSearch || (c.name || '').toLowerCase().includes(compSearch.toLowerCase())).map((c) => (
                          <div key={c.id} onMouseDown={(e) => { e.preventDefault(); setComponentInput(c.id); setCompDropdownOpen(false); }} style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(c.quantityAvailable ?? 0) + ' available'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input placeholder="Qty" id="comp-qty" defaultValue={1} type="number" min={1} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                <button onClick={() => {
                  if (!componentInput) return;
                  const qtyEl = document.getElementById('comp-qty') as HTMLInputElement | null;
                  const qty = qtyEl ? parseInt(qtyEl.value || '1', 10) : 1;
                  const comp = componentsList.find((x) => x.id === componentInput);
                  setSelectedComponents(prev => {
                    const exists = prev.find(p => p.id === componentInput);
                    if (exists) return prev.map(p => p.id === componentInput ? { ...p, quantity: p.quantity + qty } : p);
                    return [...prev, { id: componentInput, name: comp?.name, quantity: qty }];
                  });
                }} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none' }}>Add</button>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedComponents.map((c) => (
                  <div key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13 }}>{c.name || c.id} × {c.quantity}</div>
                    <button onClick={() => setSelectedComponents(prev => prev.filter(x => x.id !== c.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <input placeholder="Google Drive links (comma separated)" value={driveLinks} onChange={(e) => setDriveLinks(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            </div>

            <div className="col-span-2 flex gap-2">
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white">{creating ? 'Creating…' : 'Create'}</button>
              <button onClick={() => { setName(''); setDescription(''); setMembers([]); setMemberInput(''); setSelectedComponents([]); setComponentInput(''); setDriveLinks(''); }} className="px-4 py-2 rounded-lg border">Reset</button>
            </div>
            {errorMessage && (
              <div className="col-span-2 text-[var(--danger)] mt-2">{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}
        {projects.length === 0 ? (
          <div className="text-[var(--text-secondary)]">You are not a member of any projects yet.</div>
        ) : (
          <StaggerContainer staggerDelay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => (
                <StaggerItem key={p.id}>
                  <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group h-full flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{p.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-2">{p.description || 'No description provided'}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link href={`/student/projects/${p.id}`}>
                          <button className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white">Open</button>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-[var(--text-muted)]">
                      {p.members && Array.isArray(p.members) ? `${p.members.length} member${p.members.length !== 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
