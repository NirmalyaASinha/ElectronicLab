'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { KeyRound, Laptop, Search, ScanLine, Users } from 'lucide-react';

type LabOption = {
  id: string;
  name: string;
  location?: string | null;
};

type StudentOption = {
  id: string;
  name: string;
  email?: string | null;
};

type RfidCardItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  studentRoll?: string | null;
  rfidUid: string;
  isActive: boolean;
  assignedAt: string;
  revokedAt?: string | null;
};

type DeviceItem = {
  id: string;
  labId: string;
  deviceUid: string;
  label?: string | null;
  isActive: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
};

type EntryRow = {
  id: string;
  labName: string;
  labLocation?: string | null;
  studentName: string;
  studentRoll?: string | null;
  status: 'INSIDE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  entryAt: string;
  exitAt?: string | null;
  rfidUid: string;
};

export default function AdminLabEntriesPage() {
  const [labs, setLabs] = useState<LabOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [cards, setCards] = useState<RfidCardItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [cardsOverlayOpen, setCardsOverlayOpen] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [labsRes, studentsRes, cardsRes, devicesRes, entriesRes] = await Promise.all([
        fetch('/api/labs', { cache: 'no-store' }),
        fetch('/api/users/search?role=STUDENT', { cache: 'no-store' }),
        fetch('/api/lab-entry/cards', { cache: 'no-store' }),
        fetch('/api/lab-entry/devices', { cache: 'no-store' }),
        fetch('/api/lab-entry/history', { cache: 'no-store' }),
      ]);

      const labsData = await labsRes.json();
      const studentsData = await studentsRes.json();
      const cardsData = await cardsRes.json();
      const devicesData = await devicesRes.json();
      const entriesData = await entriesRes.json();

      if (labsData.success) {
        setLabs(labsData.data || []);
        setSelectedLabId((current) => current || labsData.data?.[0]?.id || '');
      }

      if (Array.isArray(studentsData.data)) {
        setStudents(studentsData.data);
      }

      if (cardsData.success) {
        setCards(cardsData.data || []);
      }

      if (devicesData.success) {
        setDevices(devicesData.data || []);
      }

      if (entriesData.success) {
        setEntries(entriesData.data || []);
      }
    } catch {
      setError('Failed to load lab entry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedLab = useMemo(
    () => labs.find((lab) => lab.id === selectedLabId) ?? null,
    [labs, selectedLabId]
  );

  const selectedStudentCard = useMemo(
    () => cards.find((card) => card.studentId === selectedStudentId) ?? null,
    [cards, selectedStudentId]
  );

  const filteredCards = useMemo(() => {
    const query = cardSearch.trim().toLowerCase();
    if (!query) return cards;

    return cards.filter((card) => {
      return [
        card.studentName,
        card.studentEmail ?? '',
        card.studentRoll ?? '',
        card.rfidUid,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [cardSearch, cards]);

  const generateDeviceUid = () => {
    setDeviceUid(`LAB-${selectedLabId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  };

  const createDevice = async () => {
    if (!selectedLabId) {
      setError('Please select a lab first');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/lab-entry/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId: selectedLabId,
          label: deviceLabel,
          deviceUid: deviceUid.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to create device');
        return;
      }

      setSuccess(`Device secret generated. Save it now: ${data.data.deviceSecret}`);
      setDeviceLabel('');
      setDeviceUid('');
      await loadData();
    } catch {
      setError('Failed to create device');
    } finally {
      setSaving(false);
    }
  };

  const bindCard = async () => {
    if (!selectedStudentId || !rfidUid.trim()) {
      setError('Please select a student and enter RFID UID');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/lab-entry/bind-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          rfidUid,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to bind RFID card');
        return;
      }

      setSuccess('RFID card linked successfully');
      setRfidUid('');
      await loadData();
    } catch {
      setError('Failed to bind RFID card');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">
        Loading lab entry module...
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Entries</h1>
          <p className="text-[var(--text-secondary)]">
            Bind RFID cards, register devices, and review entry sessions.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-[var(--success)] bg-[var(--success-light)] p-4 text-sm text-[var(--success)]">
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bind RFID Card</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Select student</option>
                  {students.map((student) => {
                    const card = cards.find((item) => item.studentId === student.id);
                    return (
                      <option key={student.id} value={student.id}>
                        {student.name}
                        {student.email ? ` • ${student.email}` : ''}
                        {card?.rfidUid ? ` • RFID ${card.rfidUid}` : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedStudentCard ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Bound RFID: {selectedStudentCard.rfidUid} {selectedStudentCard.isActive ? '(active)' : '(inactive)'}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">RFID UID</label>
                <input
                  value={rfidUid}
                  onChange={(event) => setRfidUid(event.target.value.toUpperCase())}
                  placeholder="04:AB:CD:12:34"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={bindCard}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <ScanLine size={16} />
                Bind Card
              </button>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Laptop size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Register Device</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Lab</label>
                  <select
                    value={selectedLabId}
                    onChange={(event) => setSelectedLabId(event.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name} {lab.location ? `• ${lab.location}` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedLab ? (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">Selected lab: {selectedLab.name}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Label</label>
                  <input
                    value={deviceLabel}
                    onChange={(event) => setDeviceLabel(event.target.value)}
                    placeholder="Lab gate NodeMCU"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Device UID</label>
                  <input
                    value={deviceUid}
                    onChange={(event) => setDeviceUid(event.target.value)}
                    placeholder="LAB-1-NODEMCU-001"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={generateDeviceUid}
                  className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Generate UID
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={createDevice}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Create Device Secret
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Users size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">RFID Card Map</h2>
              </div>
              <button
                type="button"
                onClick={() => setCardsOverlayOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] border border-[var(--border)]"
              >
                Open RFID Card Map
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Users size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Registered Devices</h2>
              </div>
              <div className="space-y-3">
                {devices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                    No devices registered yet.
                  </div>
                ) : (
                  devices.map((device) => (
                    <div key={device.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <p className="font-semibold text-[var(--text-primary)]">{device.label || device.deviceUid}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{device.deviceUid}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {device.isActive ? 'Active' : 'Inactive'} {device.lastSeenAt ? `• Last seen ${new Date(device.lastSeenAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Search size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Entries</h2>
              </div>
              <div className="space-y-3">
                {entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                    No entry sessions yet.
                  </div>
                ) : (
                  entries.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <p className="font-semibold text-[var(--text-primary)]">{entry.studentName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{entry.labName}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {entry.status} • In {new Date(entry.entryAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Search size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Entry Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--text-muted)]">
                <tr>
                  <th className="py-3 pr-4">Student</th>
                  <th className="py-3 pr-4">Lab</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Entry</th>
                  <th className="py-3 pr-4">Exit</th>
                  <th className="py-3 pr-4">RFID</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-[var(--border)]">
                    <td className="py-3 pr-4 text-[var(--text-primary)]">
                      <div className="font-medium">{entry.studentName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{entry.studentRoll}</div>
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-primary)]">
                      <div className="font-medium">{entry.labName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{entry.labLocation}</div>
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{entry.status}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{new Date(entry.entryAt).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{entry.exitAt ? new Date(entry.exitAt).toLocaleString() : 'Open'}</td>
                    <td className="py-3 pr-4 text-[var(--text-muted)]">{entry.rfidUid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {cardsOverlayOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setCardsOverlayOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">RFID Card Map</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Search by student name, email, roll number, or RFID UID.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCardsOverlayOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <input
                value={cardSearch}
                onChange={(event) => setCardSearch(event.target.value)}
                placeholder="Search RFID cards..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-3">
                {filteredCards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                    No RFID cards match your search.
                  </div>
                ) : (
                  filteredCards.map((card) => (
                    <div key={card.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{card.studentName}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {card.studentEmail ? `${card.studentEmail} • ` : ''}
                            {card.studentRoll ? `${card.studentRoll} • ` : ''}
                            RFID {card.rfidUid}
                          </p>
                        </div>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: card.isActive ? 'var(--success-light)' : 'var(--danger-light)',
                            color: card.isActive ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {card.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Assigned {new Date(card.assignedAt).toLocaleString()}
                        {card.revokedAt ? ` • Revoked ${new Date(card.revokedAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
