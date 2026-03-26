'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import RequestCard from '@/components/shared/RequestCard';

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
  studentEmail?: string;
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt: string;
  items: Component[];
}

export const dynamic = 'force-dynamic';

export default function FacultyIssued() {
  const [requests, setRequests] = useState<Request[]>([]);
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
        const approvedRequests = data.data.filter(
          (req: { status: string }) => req.status === 'APPROVED'
        );
        setRequests(approvedRequests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsIssued = async (requestId: string) => {
    try {
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

      setRequests(requests.filter((r) => r.id !== requestId));
      alert('Request marked as issued successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process');
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
                All requests issued
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                No pending requests waiting to be physically issued
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={{
                  id: request.id,
                  status: request.status,
                  purpose: request.purpose,
                  requestedAt: new Date(request.requestedAt),
                  approvedAt: new Date(request.approvedAt),
                }}
                student={{
                  name: request.studentName,
                  email: request.studentEmail || '',
                  rollNumber: request.studentRoll,
                  department: request.studentDept,
                }}
                items={request.items || []}
                showActions="issue"
                onIssue={handleMarkAsIssued}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
