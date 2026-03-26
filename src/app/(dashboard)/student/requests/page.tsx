'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import CompactRequestCard from '@/components/shared/CompactRequestCard';

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
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  rejectionReason?: string;
  items?: Component[];
}

export const dynamic = 'force-dynamic';

export default function StudentRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="animate-page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} size={32} color="var(--accent)" />
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
                No requests submitted yet
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Browse and submit your first component request
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
                mode="view"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
