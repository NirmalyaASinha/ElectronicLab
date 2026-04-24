'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { Clock3, History, Plus, School2, Send } from 'lucide-react';

type LabItem = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  responsibleFacultyName?: string | null;
  isActive: boolean;
};

type LabRequestItem = {
  id: string;
  labId: string;
  labName: string;
  labLocation?: string | null;
  facultyName?: string | null;
  reason: string;
  requestedFor: string;
  durationMinutes: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedAt?: string | null;
  decisionNote?: string | null;
  createdAt: string;
};

type LabHistoryItem = {
  id: string;
  labName: string;
  labLocation?: string | null;
  facultyName?: string | null;
  accessReason: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  accessGrantedAt: string;
  accessEndedAt?: string | null;
  requestStatus: string;
};

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function StudentLabAccessPage() {
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [requests, setRequests] = useState<LabRequestItem[]>([]);
  const [history, setHistory] = useState<LabHistoryItem[]>([]);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [requestedFor, setRequestedFor] = useState(toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [labsRes, requestsRes, historyRes] = await Promise.all([
        fetch('/api/labs', { cache: 'no-store' }),
        fetch('/api/lab-access/requests', { cache: 'no-store' }),
        fetch('/api/lab-access/history', { cache: 'no-store' }),
      ]);

      const labsData = await labsRes.json();
      const requestsData = await requestsRes.json();
      const historyData = await historyRes.json();

      if (labsData.success) {
        setLabs(labsData.data || []);
        setSelectedLabId((current) => current || labsData.data?.[0]?.id || '');
      }

      if (requestsData.success) {
        setRequests(requestsData.data || []);
      }

      if (historyData.success) {
        setHistory(historyData.data || []);
      }
    } catch {
      setError('Failed to load lab access data');
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

  const submitRequest = async () => {
    if (!selectedLabId || !reason.trim()) {
      setError('Please select a lab and enter a valid reason');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/lab-access/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId: selectedLabId,
          reason,
          requestedFor: new Date(requestedFor).toISOString(),
          durationMinutes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to submit request');
        return;
      }

      setReason('');
      await loadData();
    } catch {
      setError('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">Loading lab access...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Access After Class</h1>
          <p className="text-[var(--text-secondary)]">Request permission to access a lab after class and track your approvals.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Submit Access Request</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Choose Lab</label>
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
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Monitored by {selectedLab.responsibleFacultyName ?? 'assigned faculty'}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Requested For</label>
                  <input
                    type="datetime-local"
                    value={requestedFor}
                    onChange={(event) => setRequestedFor(event.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(Number(event.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                    <option value={180}>180 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Reason</label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={5}
                  placeholder="Explain the project or work you need the lab for"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="button"
                onClick={submitRequest}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Request Access'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <School2 size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Available Labs</h2>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Requests</h2>
            </div>
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{request.labName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{request.reason}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        For {new Date(request.requestedFor).toLocaleString()} · {request.durationMinutes} minutes
                      </p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: request.status === 'APPROVED' ? 'var(--success)' : request.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)' }}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Access History</h2>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{item.labName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{item.accessReason}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Granted {new Date(item.accessGrantedAt).toLocaleString()}
                    {item.accessEndedAt ? ` · Ended ${new Date(item.accessEndedAt).toLocaleString()}` : ' · Ongoing'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}