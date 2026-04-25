'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  visibility: 'PRIVATE' | 'OPEN';
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  ownerName: string;
  memberCount: number;
  isOwner: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export default function StudentProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'OPEN'>('PRIVATE');

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

  const myProjects = filtered.filter((project) => project.isOwner || project.isMember);
  const openProjects = filtered.filter((project) => !project.isOwner && !project.isMember && project.visibility === 'OPEN');

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

  const joinProject = async (projectId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to join project');
      }
      await loadProjects();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to join project');
    }
  };

  const renderCard = (project: ProjectRow, joinable: boolean) => (
    <StaggerItem key={project.id}>
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                {project.visibility}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{project.name}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-6">
              {project.description || 'No description provided yet.'}
            </p>
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="mt-3 text-sm text-[var(--text-secondary)]">
          {project.progress}% complete • Owner: {project.ownerName} • {project.memberCount} member{project.memberCount === 1 ? '' : 's'}
        </div>
        <div className="mt-5 flex gap-3 flex-wrap">
          <Link href={`/student/projects/${project.id}`} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">
            Open
          </Link>
          {joinable ? (
            <button
              type="button"
              onClick={() => void joinProject(project.id)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium"
            >
              Join
            </button>
          ) : null}
        </div>
      </div>
    </StaggerItem>
  );

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Projects</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              View your projects, discover open collaborations, and build your own workspace
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium"
          >
            Create Project
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
          placeholder="Search projects by name, description, owner, visibility, or status"
          className="w-full max-w-xl px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        />

        {loading ? (
          <div className="text-[var(--text-secondary)]">Loading projects...</div>
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">My and Joined Projects</h2>
                <p className="text-sm text-[var(--text-secondary)]">Projects you own or already belong to.</p>
              </div>
              {myProjects.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                  No projects yet. Create one or join an open project below.
                </div>
              ) : (
                <StaggerContainer staggerDelay={0.06}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myProjects.map((project) => renderCard(project, false))}
                  </div>
                </StaggerContainer>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Open Projects to Join</h2>
                <p className="text-sm text-[var(--text-secondary)]">Discover collaborative projects available to all students.</p>
              </div>
              {openProjects.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                  No open projects are available right now.
                </div>
              ) : (
                <StaggerContainer staggerDelay={0.06}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {openProjects.map((project) => renderCard(project, true))}
                  </div>
                </StaggerContainer>
              )}
            </section>
          </>
        )}

        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create Project</h2>
                <p className="text-sm text-[var(--text-secondary)]">Choose whether this project is private or open for other students to join.</p>
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
