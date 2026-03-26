'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { getDaysOverdue } from '@/lib/date-utils';
import CompactRequestCard from '@/components/shared/CompactRequestCard';

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
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
