'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { Check, X, AlertCircle, Loader, Clock } from 'lucide-react';
import { getRelativeTime } from '@/lib/date-utils';

interface Component {
  name: string;
  category: string;
  quantity: number;
}

interface Request {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  status: string;
  purpose: string;
  requestedAt: string;
  items: Component[];
}

interface RequestWithUI extends Request {
  showRejectForm: boolean;
  rejectReason: string;
  isProcessing: boolean;
}

export const dynamic = 'force-dynamic';

export default function FacultyApprovals() {
  const [requests, setRequests] = useState<RequestWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/requests');
      const data = await res.json();

      if (data.success && data.data) {
        // Filter only PENDING requests
        const pendingRequests = data.data.filter(
          (req: { status: string }) => req.status === 'PENDING'
        );
        setRequests(
          pendingRequests.map((req: Request) => ({
            ...req,
            showRejectForm: false,
            rejectReason: '',
            isProcessing: false,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, index: number) => {
    try {
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = true;
      setRequests(updatedRequests);

      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      // Remove approved request from list
      setRequests(requests.filter((_, i) => i !== index));
      alert('Request approved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = false;
      setRequests(updatedRequests);
    }
  };

  const handleRejectSubmit = async (requestId: string, index: number) => {
    const reason = requests[index].rejectReason.trim();

    if (!reason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = true;
      setRequests(updatedRequests);

      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'REJECT', rejectionReason: reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      // Remove rejected request from list
      setRequests(requests.filter((_, i) => i !== index));
      alert('Request rejected successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = false;
      updatedRequests[index].showRejectForm = false;
      setRequests(updatedRequests);
    }
  };

  const toggleRejectForm = (index: number) => {
    const updatedRequests = [...requests];
    updatedRequests[index].showRejectForm = !updatedRequests[index].showRejectForm;
    updatedRequests[index].rejectReason = '';
    setRequests(updatedRequests);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin" size={32} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Component Request Approvals ✅
          </h1>
          <p className="text-[var(--text-secondary)]">
            Review and approve/reject student component requests
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-[var(--danger)] bg-opacity-10 border border-[var(--danger)] flex gap-3 items-start">
            <AlertCircle size={20} className="text-[var(--danger)] flex-shrink-0 mt-0.5" />
            <p className="text-[var(--danger)] text-sm">{error}</p>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="p-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] border-dashed text-center space-y-4">
            <Clock size={48} className="mx-auto text-[var(--text-secondary)]" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No pending requests
              </h2>
              <p className="text-[var(--text-secondary)]">
                All component requests are up to date
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <div
                key={request.id}
                className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden"
              >
                {/* Student Info Header */}
                <div className="bg-[var(--bg-elevated)] border-b border-[var(--border)] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                        Student Name
                      </p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {request.studentName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                        Roll Number
                      </p>
                      <p className="text-lg font-semibold text-[var(--accent)]">
                        {request.studentRoll}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                        Department
                      </p>
                      <p className="text-sm text-[var(--text-primary)]">
                        {request.studentDept}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                        Request Date
                      </p>
                      <p className="text-sm text-[var(--text-primary)]">
                        {getRelativeTime(new Date(request.requestedAt))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">

                {/* Purpose */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Purpose</p>
                  <p className="text-[var(--text-primary)] bg-[var(--bg-base)] p-3 rounded-lg">
                    {request.purpose}
                  </p>
                </div>

                {/* Components Table */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Requested Components</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-[var(--text-primary)]">
                            Component
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-[var(--text-primary)]">
                            Category
                          </th>
                          <th className="px-4 py-2 text-center font-medium text-[var(--text-primary)]">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {request.items?.map((item, i) => (
                          <tr key={i} className="hover:bg-[var(--bg-elevated)]">
                            <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                              {item.name}
                            </td>
                            <td className="px-4 py-2 text-[var(--text-secondary)]">
                              {item.category}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-[var(--accent)]">
                              {item.quantity}x
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-[var(--border)] space-y-3">
                  {!request.showRejectForm ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(request.id, index)}
                        disabled={request.isProcessing}
                        className="flex-1 px-4 py-2 bg-[var(--success)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {request.isProcessing ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => toggleRejectForm(index)}
                        disabled={request.isProcessing}
                        className="flex-1 px-4 py-2 bg-[var(--danger)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[var(--bg-base)] p-4 rounded-lg">
                      <label className="block">
                        <span className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                          Rejection Reason (Required)
                        </span>
                        <textarea
                          value={request.rejectReason}
                          onChange={(e) => {
                            const updatedRequests = [...requests];
                            updatedRequests[index].rejectReason = e.target.value;
                            setRequests(updatedRequests);
                          }}
                          placeholder="Explain why this request is being rejected..."
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-sm resize-none"
                          rows={3}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRejectForm(index)}
                          className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface)] transition-all text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectSubmit(request.id, index)}
                          disabled={request.isProcessing || !request.rejectReason.trim()}
                          className="flex-1 px-4 py-2 bg-[var(--danger)] text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {request.isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
