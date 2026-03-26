'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { CheckCircle, AlertCircle, Loader, Send } from 'lucide-react';
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
  approvedAt: string;
  items: Component[];
}

interface RequestWithUI extends Request {
  isProcessing: boolean;
}

export const dynamic = 'force-dynamic';

export default function FacultyIssued() {
  const [requests, setRequests] = useState<RequestWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/requests');
      const data = await res.json();

      if (data.success && data.data) {
        // Filter only APPROVED requests (not yet issued)
        const approvedRequests = data.data.filter(
          (req: { status: string }) => req.status === 'APPROVED'
        );
        setRequests(
          approvedRequests.map((req: Request) => ({
            ...req,
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

  const handleMarkAsIssued = async (requestId: string, index: number) => {
    try {
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = true;
      setRequests(updatedRequests);

      const res = await fetch(`/api/requests/${requestId}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark request as issued');
      }

      // Remove issued request from list
      setRequests(requests.filter((_, i) => i !== index));
      alert('Request marked as issued successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process');
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = false;
      setRequests(updatedRequests);
    }
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
            Issue Components 📦
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage approved component requests and mark them as physically issued
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
            <CheckCircle size={48} className="mx-auto text-[var(--success)]" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                All requests issued
              </h2>
              <p className="text-[var(--text-secondary)]">
                No pending requests waiting to be physically issued
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <div
                key={request.id}
                className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-6"
              >
                {/* Student Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Student Name</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {request.studentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Roll Number</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {request.studentRoll}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Department</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {request.studentDept}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Approved</p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {getRelativeTime(new Date(request.approvedAt))}
                    </p>
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Purpose</p>
                  <p className="text-[var(--text-primary)] bg-[var(--bg-base)] p-3 rounded-lg">
                    {request.purpose}
                  </p>
                </div>

                {/* Components Table */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    Components Ready for Issue
                  </p>
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

                {/* Action Button */}
                <div className="pt-6 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleMarkAsIssued(request.id, index)}
                    disabled={request.isProcessing}
                    className="w-full px-4 py-3 bg-[var(--success)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {request.isProcessing ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Marking as Issued...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Mark as Issued
                      </>
                    )}
                  </button>
                  <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
                    This action will update inventory and notify the student of the due date
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
