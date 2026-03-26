'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  RequestGridCard,
  RequestGridSkeleton,
  type RequestListItem,
  getEffectiveStatus,
  getDaysOverdue,
  toStatus,
} from '@/components/shared/request-pattern';
import EmptyState from '@/components/ui/EmptyState';

type FilterKey = 'ACTIVE' | 'OVERDUE' | 'RETURNED';

const tabs: Array<{ key: FilterKey; label: string }> = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'RETURNED', label: 'Returned' },
];

export const dynamic = 'force-dynamic';

export default function FacultyReturnsPage() {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterKey>('ACTIVE');

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
        setError(loadError instanceof Error ? loadError.message : 'Failed to load returns');
      } finally {
        setLoading(false);
      }
    };

    void loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const status = getEffectiveStatus(request);
      if (activeTab === 'ACTIVE') return status === 'ISSUED' || status === 'OVERDUE';
      if (activeTab === 'OVERDUE') return status === 'OVERDUE';
      return status === 'RETURNED';
    });
  }, [activeTab, requests]);

  const activeCount = requests.filter((request) => {
    const status = getEffectiveStatus(request);
    return status === 'ISSUED' || status === 'OVERDUE';
  }).length;

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Returns</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Track issued components and process returns
          </p>
        </div>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '999px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {activeCount} active issues
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
          icon={RotateCcw}
          title="No active issues"
          subtitle={
            activeTab === 'RETURNED'
              ? 'No completed returns are available yet'
              : 'No components are currently issued'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => {
            const effectiveStatus = getEffectiveStatus(request);
            return (
              <div key={request.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <RequestGridCard request={request} href={`/requests/${request.id}`} viewerRole="FACULTY" />
                {effectiveStatus === 'OVERDUE' ? (
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', paddingLeft: '4px' }}>
                    {getDaysOverdue(request.dueAt)} day(s) overdue
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
