'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { School2, History, PlusCircle } from 'lucide-react';

type FacultyItem = {
  id: string;
  name: string;
  department: string;
  email: string;
};

type LabItem = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  responsibleFacultyId: string;
  responsibleFacultyName?: string | null;
  isActive: boolean;
};

type LabHistoryItem = {
  id: string;
  labName: string;
  labLocation?: string | null;
  studentName: string;
  studentRoll?: string | null;
  facultyName?: string | null;
  accessReason: string;
  status: string;
  accessGrantedAt: string;
  accessEndedAt?: string | null;
};

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [history, setHistory] = useState<LabHistoryItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [responsibleFacultyId, setResponsibleFacultyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [labsRes, historyRes, facultyRes] = await Promise.all([
        fetch('/api/labs', { cache: 'no-store' }),
        fetch('/api/lab-access/history', { cache: 'no-store' }),
        fetch('/api/faculty', { cache: 'no-store' }),
      ]);

      const labsData = await labsRes.json();
      const historyData = await historyRes.json();
      const facultyData = await facultyRes.json();

      if (labsData.success) {
        setLabs(labsData.data || []);
      }

      if (historyData.success) {
        setHistory(historyData.data || []);
      }

      if (facultyData.success) {
        setFaculty(facultyData.data || []);
        setResponsibleFacultyId((current) => current || facultyData.data?.[0]?.id || '');
      }
    } catch {
      setError('Failed to load lab management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedFaculty = useMemo(
    () => faculty.find((item) => item.id === responsibleFacultyId) ?? null,
    [faculty, responsibleFacultyId]
  );

  const createLab = async () => {
    if (!name.trim() || !responsibleFacultyId) {
      setError('Lab name and responsible faculty are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          location,
          responsibleFacultyId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to create lab');
        return;
      }

      setName('');
      setDescription('');
      setLocation('');
      await loadData();
    } catch {
      setError('Failed to create lab');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">Loading labs...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Setup</h1>
          <p className="text-[var(--text-secondary)]">Create labs and assign the responsible faculty for after-class monitoring.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Lab</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Lab Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="Embedded Systems Lab"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Location</label>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="Block A, Room 204"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="Describe the lab purpose and allowed access context"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Responsible Faculty</label>
                <select
                  value={responsibleFacultyId}
                  onChange={(event) => setResponsibleFacultyId(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  {faculty.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} • {member.department}
                    </option>
                  ))}
                </select>
                {selectedFaculty ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{selectedFaculty.email}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={createLab}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <School2 size={16} />
                {submitting ? 'Creating...' : 'Create Lab'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <School2 size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Labs</h2>
            </div>
            <div className="space-y-3">
              {labs.map((lab) => (
                <div key={lab.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{lab.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{lab.description || 'No description provided'}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {lab.location || 'Location not set'} · {lab.responsibleFacultyName || 'Faculty assigned'}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                      {lab.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Access History</h2>
            </div>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No lab access history yet.
                </div>
              ) : (
                history.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="font-semibold text-[var(--text-primary)]">{item.labName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {item.studentName} {item.studentRoll ? `• ${item.studentRoll}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.accessReason}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(item.accessGrantedAt).toLocaleString()} {item.accessEndedAt ? `· Ended ${new Date(item.accessEndedAt).toLocaleString()}` : '· Ongoing'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <School2 size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assigned Faculty</h2>
            </div>
            <div className="space-y-3">
              {faculty.map((member) => (
                <div key={member.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{member.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{member.department}</p>
                  <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}