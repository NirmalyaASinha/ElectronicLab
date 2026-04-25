'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/dashboard/PageTransition';

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  visibility: 'PRIVATE' | 'OPEN';
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  ownerName: string;
  memberCount: number;
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'OPEN'>('PRIVATE');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/projects', { cache: 'no-store' });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.error || 'Failed to load projects');
      }
      setProjects(data.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      [project.name, project.description, project.ownerName, project.visibility, project.status].join(' ').toLowerCase().includes(q)
    );
  }, [projects, search]);

  const createProject = async () => {
    try {
      setCreating(true);
      setError('');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, visibility }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create project');
      }
      setName('');
      setDescription('');
      setVisibility('PRIVATE');
      setModalOpen(false);
      await loadProjects();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Oversee every project, manage ownership, and monitor visibility across the lab ecosystem
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium"
        >
          New Project
        </button>
      </div>

      {error ? (
        <div className="px-4 py-3 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-sm">
          {error}
        </div>
      ) : null}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects by name, owner, visibility, or status"
        className="w-full max-w-xl px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
      />

      {loading ? (
        <div className="text-[var(--text-secondary)]">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div key={project.id} className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  {project.visibility}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{project.name}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-6">
                {project.description || 'No description provided yet.'}
              </p>
              <div className="mt-4 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">
                {project.progress}% complete • Owner: {project.ownerName} • {project.memberCount} member{project.memberCount === 1 ? '' : 's'}
              </div>
              <Link href={`/admin/projects/${project.id}`} className="inline-block mt-5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">
                Open Project
              </Link>
            </div>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create Admin Project</h2>
              <p className="text-sm text-[var(--text-secondary)]">Start a new project and decide whether students can discover it openly.</p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
              placeholder="Project name"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
              placeholder="Project description"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'PRIVATE' | 'OPEN')}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
            >
              <option value="PRIVATE">Private</option>
              <option value="OPEN">Open to all students</option>
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border)]">
                Cancel
              </button>
              <button type="button" onClick={() => void createProject()} disabled={creating} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </PageTransition>
  );
}
