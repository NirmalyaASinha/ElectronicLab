'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { ScanLine, Users } from 'lucide-react';

type EntryRow = {
  id: string;
  labId: string;
  labName: string;
  labLocation?: string | null;
  studentName: string;
  studentRoll?: string | null;
  status: 'INSIDE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  entryAt: string;
  exitAt?: string | null;
  rfidUid: string;
};

type LabItem = {
  id: string;
  name: string;
  location?: string | null;
};

export default function FacultyLabEntriesPage() {
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const entriesRes = await fetch('/api/lab-entry/history', { cache: 'no-store' });
      const entriesData = await entriesRes.json();

      if (entriesData.success) {
        const rows: EntryRow[] = entriesData.data || [];
        setEntries(rows);

        const uniqueLabs = Array.from(
          new Map(
            rows.map((entry) => [
              entry.labId,
              { id: entry.labId, name: entry.labName, location: entry.labLocation },
            ])
          ).values()
        );

        setLabs(uniqueLabs);
        setSelectedLabId((current) => current || uniqueLabs[0]?.id || '');
      } else {
        setError(entriesData.error || 'Failed to load lab entry history');
      }
    } catch {
      setError('Failed to load lab entry history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredEntries = useMemo(
    () => (selectedLabId ? entries.filter((entry) => entry.labId === selectedLabId) : entries),
    [entries, selectedLabId]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">
        Loading lab entry history...
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Entries</h1>
          <p className="text-[var(--text-secondary)]">View entry and exit records for your labs.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lab Filter</h2>
          </div>
          <select
            value={selectedLabId}
            onChange={(event) => setSelectedLabId(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] md:max-w-md"
          >
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name} {lab.location ? `• ${lab.location}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScanLine size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Sessions</h2>
            </div>
            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No sessions available.
                </div>
              ) : (
                filteredEntries.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="font-semibold text-[var(--text-primary)]">{entry.studentName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{entry.labName}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {entry.status} • {new Date(entry.entryAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScanLine size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Session Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--text-muted)]">
                  <tr>
                    <th className="py-3 pr-4">Student</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Entry</th>
                    <th className="py-3 pr-4">Exit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-[var(--border)]">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-[var(--text-primary)]">{entry.studentName}</div>
                        <div className="text-xs text-[var(--text-muted)]">{entry.studentRoll}</div>
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{entry.status}</td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{new Date(entry.entryAt).toLocaleString()}</td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{entry.exitAt ? new Date(entry.exitAt).toLocaleString() : 'Open'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
