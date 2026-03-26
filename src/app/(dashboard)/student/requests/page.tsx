'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { getRelativeTime } from '@/lib/date-utils';

interface Component {
  name: string;
  category: string;
  quantity: number;
}

interface Request {
  id: string;
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  items?: Component[];
}

export const dynamic = 'force-dynamic';

const statusConfig = {
  PENDING: { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', icon: Clock },
  APPROVED: { color: 'text-green-500', bgColor: 'bg-green-500/10', icon: CheckCircle },
  REJECTED: { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: XCircle },
  CANCELLED: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: XCircle },
  ISSUED: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: CheckCircle },
  RETURNED: { color: 'text-green-600', bgColor: 'bg-green-600/10', icon: CheckCircle },
  OVERDUE: { color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: AlertCircle },
};

export default function StudentRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentRequests();
  }, []);

  const fetchStudentRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/requests');
      const data = await res.json();

      if (data.success && data.data) {
        setRequests(data.data);
      } else {
        setError('Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
            My Requests 📜
          </h1>
          <p className="text-[var(--text-secondary)]">
            View your submitted component requests and their status
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500 flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Requests List or Empty State */}
        {requests.length === 0 ? (
          <div className="p-12 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border)] text-center space-y-4">
            <Clock size={48} className="mx-auto text-[var(--text-secondary)]" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No requests submitted yet
              </h2>
              <p className="text-[var(--text-secondary)]">
                Browse and submit your first component request
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const config = getStatusConfig(request.status);
              const IconComponent = config.icon;
              const isExpanded = expandedId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden hover:border-[var(--text-secondary)] transition-colors"
                >
                  {/* Summary Header */}
                  <button
                    onClick={() => toggleExpanded(request.id)}
                    className="w-full p-6 flex items-start justify-between hover:bg-[var(--bg-elevated)] transition-colors text-left"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}
                        >
                          <IconComponent
                            size={20}
                            className={config.color}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.color} ${config.bgColor}`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {getRelativeTime(new Date(request.requestedAt))}
                          </p>
                        </div>
                      </div>
                      <p className="text-[var(--text-primary)] font-medium line-clamp-2">
                        {request.purpose}
                      </p>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <svg
                        className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] p-6 bg-[var(--bg-base)] space-y-6">
                      {/* Request Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                            Request ID
                          </p>
                          <p className="text-sm font-mono text-[var(--text-primary)]">
                            {request.id.slice(0, 8)}...
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                            Requested Date
                          </p>
                          <p className="text-sm text-[var(--text-primary)]">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {request.approvedAt && (
                          <div>
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                              Approved Date
                            </p>
                            <p className="text-sm text-[var(--text-primary)]">
                              {new Date(request.approvedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Purpose */}
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Purpose
                        </p>
                        <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border)]">
                          {request.purpose}
                        </p>
                      </div>

                      {/* Rejection Reason */}
                      {request.status === 'REJECTED' && request.rejectionReason && (
                        <div>
                          <p className="text-sm font-semibold text-red-500 mb-2">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-[var(--text-primary)] bg-red-500/10 border border-red-500 p-3 rounded-lg">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Components */}
                      {request.items && request.items.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                            Requested Components ({request.items.length})
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {request.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-[var(--text-secondary)]">
                                    {item.category}
                                  </p>
                                </div>
                                <div className="ml-4 text-right">
                                  <p className="text-sm font-semibold text-[var(--accent)]">
                                    {item.quantity}x
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
