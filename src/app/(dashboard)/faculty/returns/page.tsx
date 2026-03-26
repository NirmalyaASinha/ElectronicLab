'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import CompactRequestCard from '@/components/shared/CompactRequestCard';
import DetailSheet from '@/components/shared/DetailSheet';
import RequestDetailCard from '@/components/shared/RequestDetailCard';

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
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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

      setRequests((current) => current.filter((_, i) => i !== requestIndex));
      setSelectedRequestId((current) => (current === requestId ? null : current));
      
      // Show success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        backgroundColor: #10b981;
        color: white;
        borderRadius: 6px;
        fontSize: 13px;
        fontWeight: 500;
        boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        zIndex: 9999;
      `;
      notification.textContent = '✓ Items marked as returned successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
      
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
              return (
              <CompactRequestCard
                key={request.id}
                request={{
                  ...request,
                  returnedAt: undefined,
                }}
                mode="returns"
                selectedItems={request.selectedItems}
                onQuantityChange={(itemIndex, quantity) =>
                  handleQuantityChange(requestIndex, itemIndex, quantity)
                }
                onSubmit={() => handleMarkAsReturned(request.id, requestIndex)}
                isProcessing={processingId === request.id}
                onViewDetails={() => setSelectedRequestId(request.id)}
              />
            );
          })}
        </div>
      )}

        <DetailSheet
          open={selectedRequestId !== null}
          onClose={() => setSelectedRequestId(null)}
          title="Return Details"
          subtitle={
            selectedRequestId
              ? (() => {
                  const request = requests.find((entry) => entry.id === selectedRequestId);
                  return request ? `${request.studentName} • ${request.studentRoll}` : undefined;
                })()
              : undefined
          }
        >
          {selectedRequestId
            ? (() => {
                const selectedRequest = requests.find((entry) => entry.id === selectedRequestId);

                if (!selectedRequest) {
                  return null;
                }

                const requestIndex = requests.findIndex((entry) => entry.id === selectedRequestId);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <RequestDetailCard request={selectedRequest} />

                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                        Return Quantities
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedRequest.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {item.category} • Issued {item.quantity} • Returned {item.returnedQty ?? 0}
                              </div>
                            </div>

                            <input
                              type="number"
                              min="0"
                              max={Math.max(item.quantity - (item.returnedQty ?? 0), 0)}
                              value={selectedRequest.selectedItems[itemIndex] || 0}
                              onChange={(event) =>
                                handleQuantityChange(
                                  requestIndex,
                                  itemIndex,
                                  parseInt(event.target.value, 10) || 0
                                )
                              }
                              style={{
                                width: '84px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleMarkAsReturned(selectedRequest.id, requestIndex)}
                        disabled={processingId === selectedRequest.id}
                        style={{
                          marginTop: '16px',
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: 'var(--success)',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: processingId === selectedRequest.id ? 'not-allowed' : 'pointer',
                          opacity: processingId === selectedRequest.id ? 0.6 : 1,
                        }}
                      >
                        {processingId === selectedRequest.id ? 'Processing...' : 'Mark as Returned'}
                      </button>
                    </div>
                  </div>
                );
              })()
            : null}
        </DetailSheet>
      </div>
    </div>
  );
}
