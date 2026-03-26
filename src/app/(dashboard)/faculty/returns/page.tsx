'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { CheckCircle, AlertCircle, Loader, TrendingDown, Calendar } from 'lucide-react';
import { getRelativeTime, getDaysOverdue } from '@/lib/date-utils';

interface Component {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  returnedQty?: number;
}

interface Request {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  status: string;
  purpose: string;
  issuedAt: string;
  dueAt: string;
  items: Component[];
}

interface RequestWithUI extends Request {
  isProcessing: boolean;
  selectedItems: { [key: number]: number }; // Track returned quantities
}

export const dynamic = 'force-dynamic';

export default function ProcessReturns() {
  const [requests, setRequests] = useState<RequestWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIssuedRequests();
  }, []);

  const fetchIssuedRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/requests');
      const data = await res.json();

      if (data.success && data.data) {
        // Filter only ISSUED requests (not yet returned)
        const issuedRequests = data.data.filter(
          (req: { status: string }) => req.status === 'ISSUED'
        );
        setRequests(
          issuedRequests.map((req: Request) => ({
            ...req,
            isProcessing: false,
            selectedItems: {},
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load issued items');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (requestIndex: number, itemIndex: number, quantity: number) => {
    const updatedRequests = [...requests];
    updatedRequests[requestIndex].selectedItems[itemIndex] = Math.max(0, quantity);
    setRequests(updatedRequests);
  };

  const handleMarkAsReturned = async (requestId: string, index: number) => {
    const request = requests[index];
    const selectedItems = request.selectedItems;

    // Prepare returned items - only include valid items with quantities
    const validItems = request.items.filter(item => item && item.name);
    const returnedItems = validItems
      .map((item) => {
        // Find the original index in the full items array
        const originalIndex = request.items.findIndex(
          (i) => i && i.id === item.id
        );
        return {
          id: item.id,
          componentId: item.componentId,
          quantity: selectedItems[originalIndex] || 0,
        };
      })
      .filter((item) => item.quantity > 0);

    if (returnedItems.length === 0) {
      alert('Please select at least one item to mark as returned');
      return;
    }

    try {
      const updatedRequests = [...requests];
      updatedRequests[index].isProcessing = true;
      setRequests(updatedRequests);

      const res = await fetch(`/api/requests/${requestId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnedItems: returnedItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }

      // Remove processed request from list or update it
      setRequests(requests.filter((_, i) => i !== index));
      alert('Items marked as returned successfully!');
      fetchIssuedRequests(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return');
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
            Process Returns ↩️
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage component returns from issued requests
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500 flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="p-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] border-dashed text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                All components returned
              </h2>
              <p className="text-[var(--text-secondary)]">
                No issued components pending return
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => {
              const daysOverdue = request.dueAt ? getDaysOverdue(new Date(request.dueAt)) : 0;
              const isOverdue = daysOverdue > 0;

              return (
                <div
                  key={request.id}
                  className={`rounded-lg border overflow-hidden ${
                    isOverdue
                      ? 'bg-orange-500/5 border-orange-500'
                      : 'bg-[var(--bg-surface)] border-[var(--border)]'
                  }`}
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
                          Issued Date
                        </p>
                        <p className="text-sm text-[var(--text-primary)]">
                          {request.issuedAt
                            ? new Date(request.issuedAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-6 space-y-6">
                    {/* Due Date and Status */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-[var(--accent)]" />
                          <span className="text-sm font-semibold text-[var(--text-secondary)]">
                            Due Date
                          </span>
                        </div>
                        <p className="text-lg font-bold text-[var(--text-primary)] mt-1">
                          {request.dueAt
                            ? new Date(request.dueAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      {isOverdue && (
                        <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown size={18} className="text-orange-500" />
                            <span className="font-semibold text-orange-600">OVERDUE</span>
                          </div>
                          <p className="text-sm text-orange-600">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Purpose */}
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Purpose
                      </p>
                      <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-base)] p-3 rounded-lg border border-[var(--border)]">
                        {request.purpose}
                      </p>
                    </div>

                    {/* Components - Return Form */}
                    <div>
                      {(() => {
                        const validItems = request.items.filter(item => item && item.name);
                        return (
                          <>
                            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                              Return Items ({validItems.length})
                            </p>
                            <div className="space-y-3">
                              {validItems.map((item, validIndex) => {
                                const originalIndex = request.items.findIndex(
                                  (i) => i && i.id === item.id
                                );
                                return (
                                  <div
                                    key={item.id || validIndex}
                                    className="flex items-center justify-between p-4 bg-[var(--bg-base)] rounded-lg border border-[var(--border)]"
                                  >
                                    <div className="flex-1">
                                      <p className="font-semibold text-[var(--text-primary)]">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-[var(--text-secondary)]">
                                        {item.category}
                                      </p>
                                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        Issued: <span className="font-semibold">{item.quantity}x</span>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                                        Return Qty:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={item.quantity}
                                        value={
                                          request.selectedItems[originalIndex] || 0
                                        }
                                        onChange={(e) =>
                                          handleQuantityChange(
                                            index,
                                            originalIndex,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-16 px-2 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-[var(--border)]">
                      <button
                        onClick={() => handleMarkAsReturned(request.id, index)}
                        disabled={request.isProcessing}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {request.isProcessing ? (
                          <>
                            <Loader size={18} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Mark Items as Returned
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
