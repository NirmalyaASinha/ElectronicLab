'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { CheckCircle2, History, School2, XCircle } from 'lucide-react';

type LabRequestItem = {
  id: string;
  labName: string;
  labLocation?: string | null;
  studentName: string;
  studentRoll?: string | null;
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
  studentName: string;
  studentRoll?: string | null;
  accessReason: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED' | 'NO_SHOW';
  accessGrantedAt: string;
  accessEndedAt?: string | null;
  requestStatus: string;
};

export default function FacultyLabAccessPage() {
  const [requests, setRequests] = useState<LabRequestItem[]>([]);
  const [history, setHistory] = useState<LabHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requestsRes, historyRes] = await Promise.all([
        fetch('/api/lab-access/requests', { cache: 'no-store' }),
        fetch('/api/lab-access/history', { cache: 'no-store' }),
      ]);

      const requestsData = await requestsRes.json();
      const historyData = await historyRes.json();

      if (requestsData.success) {
        setRequests(requestsData.data || []);
      }

      if (historyData.success) {
        setHistory(historyData.data || []);
      }
    } catch {
      setError('Failed to load lab access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const pendingRequests = useMemo(() => requests.filter((request) => request.status === 'PENDING'), [requests]);
  const activeHistory = useMemo(() => history.filter((item) => item.status === 'ACTIVE'), [history]);

  const reviewRequest = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    const decisionNote = window.prompt(`Optional note for ${decision.toLowerCase()} decision`, '') || '';

    const response = await fetch(`/api/lab-access/requests/${requestId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decisionNote }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.error || 'Failed to review request');
      return;
    }

    await loadData();
  };

  const completeAccess = async (requestId: string) => {
    const response = await fetch(`/api/lab-access/requests/${requestId}/complete`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.error || 'Failed to complete access');
      return;
    }

    await loadData();
  };

  if (loading) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">Loading lab access requests...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Lab Access Monitor</h1>
          <p className="text-[var(--text-secondary)]">Review student lab access requests and track lab access history.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Requests</h2>
            </div>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No pending access requests.
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{request.studentName}</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {request.labName} {request.labLocation ? `• ${request.labLocation}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{request.reason}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {new Date(request.requestedFor).toLocaleString()} · {request.durationMinutes} minutes
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--warning-light)] px-3 py-1 text-xs font-semibold text-[var(--warning)]">
                        Pending
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => reviewRequest(request.id, 'APPROVED')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--success)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        <CheckCircle2 size={15} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewRequest(request.id, 'REJECTED')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        <XCircle size={15} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Access History</h2>
            </div>
            <div className="space-y-3">
              {activeHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No active access sessions yet.
                </div>
              ) : (
                activeHistory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="font-semibold text-[var(--text-primary)]">{item.studentName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.labName}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.accessReason}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[var(--text-muted)]">
                        Granted {new Date(item.accessGrantedAt).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => completeAccess(item.id)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
                      >
                        Mark Completed
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <School2 size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Lab Access Requests</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {requests.map((request) => (
              <div key={request.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{request.studentName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{request.labName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{request.reason}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: request.status === 'APPROVED' ? 'var(--success)' : request.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)' }}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}