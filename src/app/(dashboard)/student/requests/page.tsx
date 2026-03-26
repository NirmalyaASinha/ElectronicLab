'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import {
  RequestGridCard,
  RequestGridSkeleton,
  type RequestListItem,
  toStatus,
} from '@/components/shared/request-pattern';
import EmptyState from '@/components/ui/EmptyState';

type FilterKey = 'ALL' | 'PENDING' | 'APPROVED' | 'ISSUED' | 'RETURNED';

const tabs: Array<{ key: FilterKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ISSUED', label: 'Issued' },
  { key: 'RETURNED', label: 'Returned' },
];

export const dynamic = 'force-dynamic';

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterKey>('ALL');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/requests', { cache: 'no-store' });
        const data = (await response.json()) as { success: boolean; data?: RequestListItem[] };

        if (!data.success || !data.data) {
          throw new Error('Failed to load requests');
        }

        setRequests(data.data.map((request) => ({ ...request, status: toStatus(request.status) })));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    void loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'ALL') return requests;
    return requests.filter((request) => request.status === activeTab);
  }, [activeTab, requests]);

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>My Requests</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Track your component requests and their status
        </p>
      </div>

      {error ? (
        <div style={{ padding: '14px 16px', borderRadius: '14px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-surface)',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <RequestGridSkeleton key={index} />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No requests yet"
          subtitle="Browse components to get started"
          action={{ label: 'Browse Components', href: '/student/browse' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <RequestGridCard key={request.id} request={request} href={`/requests/${request.id}`} viewerRole="STUDENT" />
          ))}
        </div>
      )}
    </div>
  );
}
