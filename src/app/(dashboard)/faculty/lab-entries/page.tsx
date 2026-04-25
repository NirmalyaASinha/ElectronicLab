'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { ScanLine, Search, Users } from 'lucide-react';

type EntryRow = {
  id: string;
  labId: string;
  labName: string;
  labLocation?: string | null;
  studentId: string;
  studentName: string;
  studentRoll?: string | null;
  status: 'INSIDE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  entryAt: string;
  exitAt?: string | null;
  rfidUid: string;
};

type DayStudentSummary = {
  studentId: string;
  studentName: string;
  studentRoll?: string | null;
  labName: string;
  visits: number;
  firstEntryAt: string;
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
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [entriesOverlayOpen, setEntriesOverlayOpen] = useState(false);
  const [entriesOverlayMode, setEntriesOverlayMode] = useState<'recent' | 'all'>('all');
  const [entrySearch, setEntrySearch] = useState('');
  const deferredEntrySearch = useDeferredValue(entrySearch);
  const [visibleHistoryEntries, setVisibleHistoryEntries] = useState(10);

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

      const entriesRes = await fetch('/api/lab-entry/history', { cache: 'no-store' });
      const entriesData = await entriesRes.json();

      if (entriesData.success) {
        const rows: EntryRow[] = entriesData.data || [];
        setEntries(rows);
        setLastUpdated(new Date());

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

  const selectedLab = useMemo(
    () => labs.find((lab) => lab.id === selectedLabId) ?? null,
    [labs, selectedLabId]
  );

  const selectedLabEntries = useMemo(
    () => (selectedLabId ? entries.filter((entry) => entry.labId === selectedLabId) : entries),
    [entries, selectedLabId]
  );

  const visibleLabHistoryEntries = useMemo(
    () => selectedLabEntries.slice(0, visibleHistoryEntries),
    [selectedLabEntries, visibleHistoryEntries]
  );

  const activeStudentsCount = useMemo(
    () => new Set(selectedLabEntries.filter((entry) => entry.status === 'INSIDE').map((entry) => entry.studentId)).size,
    [selectedLabEntries]
  );

  const recentEntries = useMemo(() => selectedLabEntries.slice(0, 6), [selectedLabEntries]);

  const visitCounts = useMemo(
    () =>
      selectedLabEntries.reduce<Record<string, number>>((acc, entry) => {
        const key = toDateKey(new Date(entry.entryAt));
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [selectedLabEntries]
  );

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startOffset; i += 1) cells.push({ date: null, key: `pad-${i}` });
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), key: `day-${day}` });
    }
    return cells;
  }, [displayMonth]);

  const monthLabel = displayMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const selectedDayEntries = useMemo(() => {
    if (!selectedDateKey) return [];
    return selectedLabEntries.filter((entry) => toDateKey(new Date(entry.entryAt)) === selectedDateKey);
  }, [selectedDateKey, selectedLabEntries]);

  const selectedDayStudents = useMemo(() => {
    const grouped = new Map<string, DayStudentSummary>();

    for (const entry of selectedDayEntries) {
      const existing = grouped.get(entry.studentId);

      if (existing) {
        existing.visits += 1;
        if (new Date(entry.entryAt).getTime() < new Date(existing.firstEntryAt).getTime()) {
          existing.firstEntryAt = entry.entryAt;
        }
      } else {
        grouped.set(entry.studentId, {
          studentId: entry.studentId,
          studentName: entry.studentName,
          studentRoll: entry.studentRoll,
          labName: entry.labName,
          visits: 1,
          firstEntryAt: entry.entryAt,
        });
      }
    }

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(left.firstEntryAt).getTime() - new Date(right.firstEntryAt).getTime()
    );
  }, [selectedDayEntries]);

  useEffect(() => {
    if (!selectedDateKey && selectedLabEntries.length > 0) {
      setSelectedDateKey(toDateKey(new Date(selectedLabEntries[0].entryAt)));
    }
  }, [selectedDateKey, selectedLabEntries]);

  const filteredEntries = useMemo(() => {
    const source = entriesOverlayMode === 'recent' ? recentEntries : selectedLabEntries;
    const query = deferredEntrySearch.trim().toLowerCase();
    if (!query) return source;

    return source.filter((entry) => {
      return [
        entry.studentName,
        entry.studentRoll ?? '',
        entry.labName,
        entry.labLocation ?? '',
        entry.rfidUid,
        entry.status,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [deferredEntrySearch, entriesOverlayMode, recentEntries, selectedLabEntries]);

  const entriesOverlay =
    entriesOverlayOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
            onClick={() => setEntriesOverlayOpen(false)}
          >
            <div
              className="w-full max-w-6xl rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {entriesOverlayMode === 'recent' ? 'Recent Entries' : 'All Entry Records'}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Search by student, lab, RFID UID, or session status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEntriesOverlayOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setEntriesOverlayMode('recent')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    entriesOverlayMode === 'recent'
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  }`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setEntriesOverlayMode('all')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    entriesOverlayMode === 'all'
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  }`}
                >
                  All Records
                </button>
              </div>

              <div className="mt-5">
                <input
                  value={entrySearch}
                  onChange={(event) => setEntrySearch(event.target.value)}
                  placeholder="Search entry records..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {filteredEntries.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                      No entry records match your search.
                    </div>
                  ) : (
                    filteredEntries.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{entry.studentName}</p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {entry.studentRoll ? `${entry.studentRoll} • ` : ''}
                              {entry.labName}
                              {entry.labLocation ? ` • ${entry.labLocation}` : ''}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: entry.status === 'INSIDE' ? 'var(--success-light)' : 'var(--bg-base)',
                              color: entry.status === 'INSIDE' ? 'var(--success)' : 'var(--text-muted)',
                            }}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-[var(--text-muted)] md:grid-cols-3">
                          <span>Entry: {new Date(entry.entryAt).toLocaleString()}</span>
                          <span>Exit: {entry.exitAt ? new Date(entry.exitAt).toLocaleString() : 'Open'}</span>
                          <span>RFID: {entry.rfidUid}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

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

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lab Visit Calendar</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Click a date to see how many students entered and who they were.
                </p>
                {lastUpdated ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Last updated {lastUpdated.toLocaleTimeString()}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{monthLabel}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{selectedLab ? selectedLab.name : 'All labs'} overview</p>
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
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(toDateKey(cell.date!))}
                    className={`min-h-16 rounded-xl border p-1.5 text-left transition sm:min-h-20 sm:p-2 ${
                      selectedDateKey === toDateKey(cell.date)
                        ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]'
                    }`}
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
                        {visitCounts[toDateKey(cell.date)]} student{visitCounts[toDateKey(cell.date)] === 1 ? '' : 's'}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[var(--text-muted)] sm:mt-2 sm:text-[11px]">No visits</p>
                    )}
                  </button>
                ) : (
                  <div key={cell.key} />
                )
              )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Day Details</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {selectedDateKey ? `Entries for ${selectedDateKey}` : 'Choose a date on the calendar.'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Students entered</span>
                <span className="rounded-full bg-[var(--success-light)] px-3 py-1 text-sm font-semibold text-[var(--success)]">
                  {selectedDayStudents.length}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDateKey ? (
                selectedDayStudents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                    No students entered on this date.
                  </div>
                ) : (
                  selectedDayStudents.map((entry) => (
                    <div key={entry.studentId} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{entry.studentName}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {entry.studentRoll ? `${entry.studentRoll} • ` : ''}
                            {entry.labName}
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                          {entry.visits} visit{entry.visits === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        First entry: {new Date(entry.firstEntryAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  Pick a date to see who entered.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Users size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-medium">Active Students</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{activeStudentsCount}</div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Currently inside{selectedLab ? ` ${selectedLab.name}` : ' the selected lab'}.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <ScanLine size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-medium">Total Sessions</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{selectedLabEntries.length}</div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">All records for the selected lab.</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Search size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-medium">Quick Search</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEntriesOverlayMode('recent');
                  setEntriesOverlayOpen(true);
                }}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                Recent
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntriesOverlayMode('all');
                  setEntriesOverlayOpen(true);
                }}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                All Records
              </button>
            </div>
          </div>
        </div>

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
              {recentEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No sessions available.
                </div>
              ) : (
                recentEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{entry.studentName}</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {entry.labName}
                          {entry.labLocation ? ` • ${entry.labLocation}` : ''}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: entry.status === 'INSIDE' ? 'var(--success-light)' : 'var(--bg-base)',
                          color: entry.status === 'INSIDE' ? 'var(--success)' : 'var(--text-muted)',
                        }}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Entry {new Date(entry.entryAt).toLocaleString()}
                      {entry.exitAt ? ` • Exit ${new Date(entry.exitAt).toLocaleString()}` : ' • Open'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Session Log</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEntriesOverlayMode('all');
                  setEntriesOverlayOpen(true);
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Open Search
              </button>
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
                  {visibleLabHistoryEntries.map((entry) => (
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
            {selectedLabEntries.length > visibleHistoryEntries ? (
              <button
                type="button"
                onClick={() => setVisibleHistoryEntries((current) => current + 10)}
                className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Load more
              </button>
            ) : null}
          </div>
        </div>

        {entriesOverlay}
      </div>
    </PageTransition>
  );
}
