'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type ViewerRole = 'STUDENT' | 'ADMIN';

type ProjectDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'PRIVATE' | 'OPEN';
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string } | null;
  members: Array<{
    id: string;
    projectId: string;
    userId: string;
    role: 'OWNER' | 'MEMBER';
    joinedAt: string;
    user: { id: string; name: string; email: string; role: string } | null;
  }>;
  components: Array<{
    id: string;
    projectId: string;
    componentId: string;
    quantity: number;
    notes: string | null;
    addedBy: string | null;
    createdAt: string;
    component: { id: string; name: string; category: string | null } | null;
  }>;
  isOwner: boolean;
  isMember: boolean;
  canEdit: boolean;
  canJoin: boolean;
};

type UserSuggestion = {
  id?: string;
  label: string;
  email?: string;
};

type AvailableComponent = {
  id: string;
  name: string;
  category?: string | null;
};

type Props = {
  projectId: string;
  viewerRole: ViewerRole;
};

type ProjectTab = 'OVERVIEW' | 'MEMBERS' | 'COMPONENTS' | 'SETTINGS';

const tabs: Array<{ key: ProjectTab; label: string }> = [
  { key: 'OVERVIEW', label: 'Overview' },
  { key: 'MEMBERS', label: 'Members' },
  { key: 'COMPONENTS', label: 'Components' },
  { key: 'SETTINGS', label: 'Settings' },
];

function statusTone(status: ProjectDetail['status']) {
  if (status === 'PLANNING') return { bg: 'rgba(245, 158, 11, 0.16)', fg: '#fbbf24' };
  if (status === 'ACTIVE') return { bg: 'rgba(59, 130, 246, 0.16)', fg: '#60a5fa' };
  if (status === 'ON_HOLD') return { bg: 'rgba(249, 115, 22, 0.16)', fg: '#fb923c' };
  return { bg: 'rgba(34, 197, 94, 0.16)', fg: '#4ade80' };
}

function visibilityTone(visibility: ProjectDetail['visibility']) {
  if (visibility === 'OPEN') return { bg: 'rgba(34, 197, 94, 0.16)', fg: '#4ade80' };
  return { bg: 'rgba(148, 163, 184, 0.16)', fg: '#cbd5e1' };
}

export default function ProjectDetailClient({ projectId, viewerRole }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = String((session?.user as { id?: string } | undefined)?.id || '');
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ProjectTab>('OVERVIEW');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'OPEN'>('PRIVATE');
  const [status, setStatus] = useState<'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('PLANNING');
  const [progress, setProgress] = useState(0);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<UserSuggestion[]>([]);
  const [componentId, setComponentId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [componentNotes, setComponentNotes] = useState('');
  const [availableComponents, setAvailableComponents] = useState<AvailableComponent[]>([]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to load project');
      }

      const detail = data.data as ProjectDetail;
      setProject(detail);
      setName(detail.name);
      setDescription(detail.description);
      setVisibility(detail.visibility);
      setStatus(detail.status);
      setProgress(detail.progress);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!project?.canEdit) return;

    let active = true;
    const loadComponents = async () => {
      try {
        const response = await fetch('/api/components', { cache: 'no-store' });
        const data = await response.json();
        if (active && data.success && Array.isArray(data.data)) {
          setAvailableComponents(data.data);
        }
      } catch {
        if (active) setAvailableComponents([]);
      }
    };

    void loadComponents();
    return () => {
      active = false;
    };
  }, [project?.canEdit]);

  useEffect(() => {
    if (!project?.canEdit || !memberQuery.trim()) {
      setMemberResults([]);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          query: memberQuery.trim(),
          limit: '10',
        });
        if (viewerRole === 'STUDENT') {
          params.set('role', 'STUDENT');
        }
        const response = await fetch(`/api/users/search?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();
        if (active && data.success && Array.isArray(data.data)) {
          const existingIds = new Set(project.members.map((member) => member.userId));
          setMemberResults(
            data.data
              .filter((user: any) => !existingIds.has(user.id))
              .map((user: any) => ({
                id: user.id,
                label: user.name || user.email,
                email: user.email,
              }))
          );
        }
      } catch {
        if (active) setMemberResults([]);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [memberQuery, project, viewerRole]);

  const openMemberCount = useMemo(() => project?.members.length || 0, [project]);
  const statusColors = project ? statusTone(project.status) : null;
  const visibilityColors = project ? visibilityTone(project.visibility) : null;
  const derivedActivity = useMemo(() => {
    if (!project) return [];

    const items: Array<{ label: string; meta: string }> = [];
    items.push({
      label: `${project.owner?.name || 'Owner'} created the project`,
      meta: new Date(project.createdAt).toLocaleString(),
    });

    for (const member of project.members.slice(0, 4)) {
      items.push({
        label: `${member.user?.name || 'A member'} joined the project`,
        meta: new Date(member.joinedAt).toLocaleString(),
      });
    }

    for (const component of project.components.slice(0, 4)) {
      items.push({
        label: `${component.component?.name || 'A component'} was linked`,
        meta: new Date(component.createdAt).toLocaleString(),
      });
    }

    return items
      .sort((a, b) => new Date(b.meta).getTime() - new Date(a.meta).getTime())
      .slice(0, 6);
  }, [project]);

  const saveProject = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          visibility,
          status,
          progress,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save project');
      }
      await loadProject();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const joinProject = async () => {
    try {
      setJoining(true);
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
      await loadProject();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to join project');
    } finally {
      setJoining(false);
    }
  };

  const addMember = async (userId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add member');
      }
      setMemberQuery('');
      setMemberResults([]);
      await loadProject();
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : 'Failed to add member');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove member');
      }
      await loadProject();
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : 'Failed to remove member');
    }
  };

  const leaveProject = async () => {
    if (!project) return;
    const selfMembership = project.members.find((member) => member.role !== 'OWNER' && member.userId === currentUserId);
    if (!selfMembership) return;
    await removeMember(selfMembership.id);
  };

  const addComponent = async () => {
    if (!componentId) return;
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId,
          quantity: componentQuantity,
          notes: componentNotes,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add component');
      }
      setComponentId('');
      setComponentQuantity(1);
      setComponentNotes('');
      await loadProject();
    } catch (componentError) {
      setError(componentError instanceof Error ? componentError.message : 'Failed to add component');
    }
  };

  const removeComponent = async (entryId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}/components`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove component');
      }
      await loadProject();
    } catch (componentError) {
      setError(componentError instanceof Error ? componentError.message : 'Failed to remove component');
    }
  };

  if (loading) {
    return <div className="p-6 text-[var(--text-secondary)]">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-6 text-[var(--danger)]">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(96,165,250,0.12),rgba(15,23,42,0.9)_38%,rgba(34,197,94,0.08))]">
        <button
          type="button"
          onClick={() => router.push(viewerRole === 'ADMIN' ? '/admin/projects' : '/student/projects')}
          className="mb-5 text-sm text-[var(--accent)]"
        >
          ← Back to Projects
        </button>

        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-3xl">
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: visibilityColors?.bg, color: visibilityColors?.fg }}>
                {project.visibility}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: statusColors?.bg, color: statusColors?.fg }}>
                {project.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                {project.progress}% complete
              </span>
            </div>

            <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{project.name}</h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
              {project.description || 'No description provided.'}
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[rgba(15,23,42,0.35)] border border-[var(--border)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Owner</div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{project.owner?.name || 'Unknown'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[rgba(15,23,42,0.35)] border border-[var(--border)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Members</div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{openMemberCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[rgba(15,23,42,0.35)] border border-[var(--border)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Components</div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{project.components.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[rgba(15,23,42,0.35)] border border-[var(--border)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Updated</div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{new Date(project.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm p-5 rounded-3xl bg-[rgba(15,23,42,0.38)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Progress Lane</div>
                <div className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{project.progress}%</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center text-2xl">
                {project.status === 'COMPLETED' ? '🏁' : project.status === 'ACTIVE' ? '🚀' : project.status === 'ON_HOLD' ? '⏸️' : '🧭'}
              </div>
            </div>

            <div className="mt-5 h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa,#4ade80)]" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              {project.canJoin ? (
                <button
                  type="button"
                  onClick={() => void joinProject()}
                  disabled={joining}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium"
                >
                  {joining ? 'Joining...' : 'Join Project'}
                </button>
              ) : viewerRole === 'STUDENT' && project.isMember && !project.isOwner ? (
                <button
                  type="button"
                  onClick={() => void leaveProject()}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium"
                >
                  Leave Project
                </button>
              ) : null}
              {project.canEdit ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('SETTINGS')}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium"
                >
                  Edit Workspace
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-4 py-3 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-sm">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-surface)',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              border: activeTab === tab.key ? '1px solid transparent' : '1px solid var(--border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_420px] gap-6">
        <div className="space-y-6">
          {activeTab === 'OVERVIEW' ? (
            <>
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Project Snapshot</h2>
                  <span className="text-sm text-[var(--text-secondary)]">Workspace summary</span>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Owner</div>
                    <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{project.owner?.name || 'Unknown'}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Members</div>
                    <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{openMemberCount}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Components</div>
                    <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{project.components.length}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Updated</div>
                    <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{new Date(project.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Progress Timeline</h2>
                  <span className="text-sm text-[var(--text-secondary)]">{project.status.replace('_', ' ')}</span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Idea', active: true },
                    { label: 'Planning', active: project.progress >= 15 || project.status !== 'PLANNING' },
                    { label: 'Building', active: project.progress >= 45 || project.status === 'ACTIVE' || project.status === 'COMPLETED' },
                    { label: 'Testing / Done', active: project.progress >= 80 || project.status === 'COMPLETED' },
                  ].map((step, index) => (
                    <div key={step.label} className="relative p-4 rounded-2xl border" style={{ borderColor: step.active ? 'rgba(96,165,250,0.35)' : 'var(--border)', backgroundColor: step.active ? 'rgba(96,165,250,0.08)' : 'var(--bg-elevated)' }}>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Stage {index + 1}</div>
                      <div className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{step.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 h-4 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa,#38bdf8,#4ade80)]" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Quick Activity</h2>
                  <span className="text-sm text-[var(--text-secondary)]">Latest project actions</span>
                </div>
                <div className="mt-5 space-y-3">
                  {derivedActivity.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex gap-4 items-start p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(96,165,250,0.14)] flex items-center justify-center text-lg">
                        {index === 0 ? '✨' : index % 2 === 0 ? '👥' : '📦'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{item.label}</div>
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'MEMBERS' ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Team Members</h2>
                <span className="text-sm text-[var(--text-secondary)]">{project.members.length} total</span>
              </div>

              {project.canEdit ? (
                <div className="mt-5 space-y-3">
                  <input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                    placeholder={viewerRole === 'ADMIN' ? 'Search users to add' : 'Search students to add'}
                  />
                  {memberResults.length > 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
                      {memberResults.slice(0, 5).map((result) => (
                        <button
                          key={`${result.id}-${result.email}`}
                          type="button"
                          onClick={() => result.id && void addMember(result.id)}
                          className="w-full px-4 py-4 text-left bg-[var(--bg-elevated)] border-b last:border-b-0 border-[var(--border)]"
                        >
                          <div className="text-sm font-medium text-[var(--text-primary)]">{result.label}</div>
                          {result.email ? <div className="text-xs text-[var(--text-secondary)] mt-1">{result.email}</div> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.members.map((member) => (
                  <div key={member.id} className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-[rgba(96,165,250,0.14)] flex items-center justify-center text-lg font-semibold text-[var(--text-primary)]">
                        {(member.user?.name || member.userId).charAt(0)}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-[var(--text-primary)]">{member.user?.name || member.userId}</div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">{member.user?.email || 'No email'}</div>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-base)] text-[var(--text-secondary)]">{member.role}</span>
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-base)] text-[var(--text-secondary)]">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {project.canEdit && member.role !== 'OWNER' ? (
                      <button
                        type="button"
                        onClick={() => void removeMember(member.id)}
                        className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'COMPONENTS' ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Component Workspace</h2>
                <span className="text-sm text-[var(--text-secondary)]">{project.components.length} linked</span>
              </div>

              {project.canEdit ? (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={componentId}
                    onChange={(e) => setComponentId(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                  >
                    <option value="">Select component</option>
                    {availableComponents.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={componentQuantity}
                    onChange={(e) => setComponentQuantity(Number(e.target.value) || 1)}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                    placeholder="Qty"
                  />
                  <input
                    value={componentNotes}
                    onChange={(e) => setComponentNotes(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                    placeholder="Notes"
                  />
                  <button
                    type="button"
                    onClick={() => void addComponent()}
                    className="px-4 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                  >
                    Add Component
                  </button>
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {project.components.length === 0 ? (
                  <div className="text-sm text-[var(--text-secondary)]">No components linked to this project yet.</div>
                ) : (
                  project.components.map((entry) => (
                    <div key={entry.id} className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-[var(--text-primary)]">{entry.component?.name || entry.componentId}</div>
                        <div className="mt-2 text-sm text-[var(--text-secondary)]">
                          Qty {entry.quantity}{entry.component?.category ? ` • ${entry.component.category}` : ''}{entry.notes ? ` • ${entry.notes}` : ''}
                        </div>
                        <div className="mt-2 text-xs text-[var(--text-muted)]">
                          Linked on {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {project.canEdit ? (
                        <button
                          type="button"
                          onClick={() => void removeComponent(entry.id)}
                          className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'SETTINGS' ? (
            project.canEdit ? (
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Workspace Settings</h2>
                  <span className="text-sm text-[var(--text-secondary)]">Owner and admin controls</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'PRIVATE' | 'OPEN')}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="OPEN">Open</option>
                  </select>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED')}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                    placeholder="Progress"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveProject()}
                  disabled={saving}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                Only the owner or admin can edit this project.
              </div>
            )
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Project Signals</h2>
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Visibility</div>
                <div className="mt-2 text-sm font-semibold" style={{ color: visibilityColors?.fg }}>{project.visibility}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</div>
                <div className="mt-2 text-sm font-semibold" style={{ color: statusColors?.fg }}>{project.status.replace('_', ' ')}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Collaboration Mode</div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {project.visibility === 'OPEN' ? 'Students can discover and join directly' : 'Membership is controlled by the owner'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            <div className="mt-5 space-y-3">
              {derivedActivity.map((item, index) => (
                <div key={`${item.label}-${index}-side`} className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.label}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
