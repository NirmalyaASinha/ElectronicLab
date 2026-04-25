'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { ScanLine } from 'lucide-react';

type EntryRow = {
  id: string;
  labName: string;
  labLocation?: string | null;
  status: 'INSIDE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  entryAt: string;
  exitAt?: string | null;
  rfidUid: string;
};

export default function StudentLabEntriesPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/lab-entry/history', { cache: 'no-store' });
        const data = await response.json();

        if (data.success) {
          setEntries(data.data || []);
        } else {
          setError(data.error || 'Failed to load your lab entries');
        }
      } catch {
        setError('Failed to load your lab entries');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">
        Loading your lab entries...
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Entries</h1>
          <p className="text-[var(--text-secondary)]">See when you entered and exited each lab.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <ScanLine size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Session History</h2>
          </div>

          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                No lab entries found yet.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{entry.labName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{entry.labLocation}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Entry: {new Date(entry.entryAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Exit: {entry.exitAt ? new Date(entry.exitAt).toLocaleString() : 'Open'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
