'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardX } from 'lucide-react';
import {
  RequestGridCard,
  RequestGridSkeleton,
  type RequestListItem,
  toStatus,
} from '@/components/shared/request-pattern';
import EmptyState from '@/components/ui/EmptyState';

type FilterKey = 'APPROVED' | 'ISSUED' | 'ALL';

const tabs: Array<{ key: FilterKey; label: string }> = [
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ISSUED', label: 'Issued' },
  { key: 'ALL', label: 'All' },
];

export const dynamic = 'force-dynamic';

export default function FacultyIssuedPage() {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterKey>('APPROVED');

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Issue Components</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Approved requests ready to be physically issued
          </p>
        </div>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '999px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {requests.filter((request) => request.status === 'APPROVED').length} action needed
        </div>
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
          icon={ClipboardX}
          title="No requests found"
          subtitle="There are no requests matching this issuing view"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <RequestGridCard key={request.id} request={request} href={`/requests/${request.id}`} viewerRole="FACULTY" />
          ))}
        </div>
      )}
    </div>
  );
}
