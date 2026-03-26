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
  requestedAt: string;
  items: Component[];
}

export const dynamic = 'force-dynamic';

export default function FacultyApprovals() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

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
        const pendingRequests = data.data.filter(
          (req: { status: string }) => req.status === 'PENDING'
        );
        setRequests(pendingRequests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
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

      setRequests((current) => current.filter((r) => r.id !== requestId));
      setSelectedRequest((current) => (current?.id === requestId ? null : current));
      
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
      notification.textContent = '✓ Request approved successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      setProcessingId(requestId);
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

      setRequests((current) => current.filter((r) => r.id !== requestId));
      setSelectedRequest((current) => (current?.id === requestId ? null : current));
      
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
      notification.textContent = '✓ Request rejected successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
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

        {/* Requests List */}
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
                No pending requests
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                All component requests are up to date
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((request) => (
              <CompactRequestCard
                key={request.id}
                request={{
                  ...request,
                  items: request.items || [],
                }}
                mode="approvals"
                isProcessing={processingId === request.id}
                onViewDetails={() => setSelectedRequest(request)}
                onApprove={() => handleApprove(request.id)}
                onReject={() => {
                  const reason = prompt('Enter reason for rejection (optional):');
                  if (reason !== null) {
                    handleReject(request.id, reason);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <DetailSheet
        open={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        subtitle={selectedRequest ? `${selectedRequest.studentName} • ${selectedRequest.studentRoll}` : undefined}
      >
        {selectedRequest ? (
          <RequestDetailCard
            request={selectedRequest}
            actionMode="approve"
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : null}
      </DetailSheet>
    </div>
  );
}
