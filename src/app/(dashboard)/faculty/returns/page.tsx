'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { getDaysOverdue } from '@/lib/date-utils';

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
  studentEmail?: string;
  status: string;
  purpose: string;
  issuedAt: string;
  dueAt: string;
  items: Component[];
}

interface RequestWithUI extends Request {
  selectedItems: { [key: number]: number };
}

export const dynamic = 'force-dynamic';

export default function ProcessReturns() {
  const [requests, setRequests] = useState<RequestWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
        const issuedRequests = data.data.filter(
          (req: { status: string }) => req.status === 'ISSUED'
        );
        setRequests(
          issuedRequests.map((req: Request) => ({
            ...req,
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

  const handleMarkAsReturned = async (requestId: string, requestIndex: number) => {
    const request = requests[requestIndex];
    const selectedItems = request.selectedItems;

    const validItems = request.items.filter((item) => item && item.name);
    const returnedItems = validItems
      .map((item) => {
        const originalIndex = request.items.findIndex((i) => i && i.id === item.id);
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
      setProcessingId(requestId);

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

      setRequests(requests.filter((_, i) => i !== requestIndex));
      alert('Items marked as returned successfully!');
      fetchIssuedRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
          <Loader size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* Requests List or Empty State */}
        {requests.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <AlertCircle size={48} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                All components returned
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                No issued components pending return
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((request, requestIndex) => {
              const daysOverdue = request.dueAt ? getDaysOverdue(new Date(request.dueAt)) : 0;
              const isOverdue = daysOverdue > 0;
              const validItems = request.items.filter((item) => item && item.name);

              return (
                <div
                  key={request.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    ...(isOverdue && { borderLeft: '3px solid var(--danger)' }),
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Student
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {request.studentName}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Roll
                        </div>
                        <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          {request.studentRoll}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Department
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>
                          {request.studentDept}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Due Date
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>
                          {request.dueAt ? new Date(request.dueAt).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    {/* Overdue Alert */}
                    {isOverdue && (
                      <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Overdue
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--danger)' }}>
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </p>
                      </div>
                    )}

                    {/* Purpose */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Purpose
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {request.purpose}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Return Items ({validItems.length})
                      </div>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {validItems.map((item, validIndex) => {
                          const originalIndex = request.items.findIndex((i) => i && i.id === item.id);
                          return (
                            <div
                              key={item.id || validIndex}
                              style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-muted)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {item.category} • Issued: <span style={{ fontWeight: 600 }}>{item.quantity}</span>x
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                  Return:
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={request.selectedItems[originalIndex] || 0}
                                  onChange={(e) =>
                                    handleQuantityChange(requestIndex, originalIndex, parseInt(e.target.value) || 0)
                                  }
                                  style={{
                                    width: '60px',
                                    padding: '6px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div
                    style={{
                      padding: '14px 20px',
                      borderTop: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                    }}
                  >
                    <button
                      onClick={() => handleMarkAsReturned(request.id, requestIndex)}
                      disabled={processingId === request.id}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                        opacity: processingId === request.id ? 0.6 : 1,
                        transition: 'opacity 200ms ease',
                      }}
                    >
                      {processingId === request.id ? 'Processing...' : 'Mark Items as Returned'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
