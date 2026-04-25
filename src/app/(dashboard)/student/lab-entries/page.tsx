'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { ChevronLeft, ChevronRight, ScanLine } from 'lucide-react';

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
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [visibleEntries, setVisibleEntries] = useState(10);

  const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');

      const response = await fetch('/api/lab-entry/history', { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setEntries(data.data || []);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to load your lab entries');
      }
    } catch {
      setError('Failed to load your lab entries');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
      const timer = setInterval(() => {
        void loadData(false);
      }, 3000);

    return () => clearInterval(timer);
  }, []);

  const visitCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      const visited = new Date(entry.entryAt);
      const key = toDateKey(visited);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ date: null, key: `pad-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        date: new Date(year, month, day),
        key: `day-${day}`,
      });
    }

    return cells;
  }, [displayMonth]);

  const totalVisitsInMonth = useMemo(() => {
    const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const monthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);

    return entries.filter((entry) => {
      const visited = new Date(entry.entryAt);
      return visited >= monthStart && visited < monthEnd;
    }).length;
  }, [displayMonth, entries]);

  const monthLabel = displayMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const visibleHistoryEntries = useMemo(() => entries.slice(0, visibleEntries), [entries, visibleEntries]);

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
          {lastUpdated ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">Last updated {lastUpdated.toLocaleTimeString()}</p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-xl border border-[var(--danger)] bg-white/40 px-3 py-1.5 text-xs font-semibold text-[var(--danger)]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ScanLine size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Visit Calendar</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)]"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)]"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{monthLabel}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {totalVisitsInMonth} lab visit{totalVisitsInMonth === 1 ? '' : 's'} this month.
              </p>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--text-muted)] sm:gap-2 sm:text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-1 sm:py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 overflow-x-auto pb-1">
              <div className="grid min-w-[320px] grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell) =>
                cell.date ? (
                  <div
                    key={cell.key}
                    className="min-h-16 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 sm:min-h-20 sm:p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)] sm:text-sm">{cell.date.getDate()}</span>
                      {visitCounts[toDateKey(cell.date)] ? (
                        <span className="rounded-full bg-[var(--success-light)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--success)] sm:px-2 sm:text-[10px]">
                          {visitCounts[toDateKey(cell.date)]}
                        </span>
                      ) : null}
                    </div>
                    {visitCounts[toDateKey(cell.date)] ? (
                      <p className="mt-1.5 text-[10px] text-[var(--success)] sm:mt-2 sm:text-[11px]">
                        {visitCounts[toDateKey(cell.date)]} visit
                        {visitCounts[toDateKey(cell.date)] === 1 ? '' : 's'}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[var(--text-muted)] sm:mt-2 sm:text-[11px]">No visit</p>
                    )}
                  </div>
                ) : (
                  <div key={cell.key} />
                )
              )}
              </div>
            </div>
          </div>

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
                visibleHistoryEntries.map((entry) => (
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

            {entries.length > visibleEntries ? (
              <button
                type="button"
                onClick={() => setVisibleEntries((current) => current + 10)}
                className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Load more
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
