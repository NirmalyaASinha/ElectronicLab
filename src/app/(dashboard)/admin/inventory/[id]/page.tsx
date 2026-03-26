'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronLeft, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/ui/StatusBadge';
import SectionLabel from '@/components/ui/SectionLabel';
import {
  RequestDetailSkeleton,
  formatDateOnly,
} from '@/components/shared/request-pattern';

interface InventoryComponent {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  modelNumber?: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  lowStockThreshold?: number;
  maxIssueQuantity?: number;
  maxIssueDays?: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  specs?: Record<string, unknown> | null;
}

interface RequestItem {
  id: string;
  componentId: string;
  quantity: number;
  returnedQty?: number;
}

interface RequestRecord {
  id: string;
  studentName: string;
  studentRoll: string;
  status: string;
  issuedAt?: string;
  returnedAt?: string;
  dueAt?: string;
  items: RequestItem[];
}

export const dynamic = 'force-dynamic';

export default function AdminInventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [component, setComponent] = useState<InventoryComponent | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({
    quantityTotal: '',
    lowStockThreshold: '',
    maxIssueQuantity: '',
    maxIssueDays: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [componentsResponse, requestsResponse] = await Promise.all([
          fetch('/api/components', { cache: 'no-store' }),
          fetch('/api/requests', { cache: 'no-store' }),
        ]);

        const componentsData = (await componentsResponse.json()) as { success: boolean; data?: InventoryComponent[] };
        const requestsData = (await requestsResponse.json()) as { success: boolean; data?: RequestRecord[] };

        const selected = componentsData.data?.find((entry) => entry.id === params.id) ?? null;
        if (!componentsData.success || !selected) {
          throw new Error('Component not found');
        }

        setComponent(selected);
        setRequests(requestsData.data ?? []);
        setFormState({
          quantityTotal: String(selected.quantityTotal ?? ''),
          lowStockThreshold: String(selected.lowStockThreshold ?? ''),
          maxIssueQuantity: String(selected.maxIssueQuantity ?? ''),
          maxIssueDays: String(selected.maxIssueDays ?? ''),
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load component detail');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [params.id]);

  const history = useMemo(() => {
    if (!component) return [];
    return requests
      .flatMap((request) =>
        request.items
          .filter((item) => item.componentId === component.id)
          .map((item) => ({
            id: `${request.id}-${item.id}`,
            studentName: request.studentName,
            studentRoll: request.studentRoll,
            status: request.status,
            quantity: item.quantity,
            issuedAt: request.issuedAt,
            returnedAt: request.returnedAt,
            dueAt: request.dueAt,
          }))
      )
      .sort((left, right) => new Date(right.issuedAt ?? right.dueAt ?? 0).getTime() - new Date(left.issuedAt ?? left.dueAt ?? 0).getTime());
  }, [component, requests]);

  if (loading) {
    return <RequestDetailSkeleton />;
  }

  if (!component) {
    return <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error || 'Component not found'}</div>;
  }

  const stockPercent =
    component.quantityTotal > 0
      ? Math.max(0, Math.min(100, (component.quantityAvailable / component.quantityTotal) * 100))
      : 0;

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: '52px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Component</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {component.name}
          </div>
        </div>
        <StatusBadge status={component.status} size="md" />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '0 24px 24px' }}>
        <div style={{ display: 'grid', gap: '20px' }} className="lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Boxes size={28} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {component.name}
                  </div>
                  <div style={{ marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {component.modelNumber ?? 'Model unavailable'}
                  </div>
                  <div style={{ marginTop: '10px', display: 'inline-flex', padding: '5px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                    {component.category}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <SectionLabel>Specifications</SectionLabel>
              {component.specs && Object.keys(component.specs).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(component.specs).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'right' }}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No specifications recorded</p>
              )}
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <SectionLabel>Issue History</SectionLabel>
              {history.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No issue history yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((entry) => (
                    <div key={entry.id} style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {entry.status === 'ISSUED' || entry.status === 'OVERDUE'
                          ? `Currently with ${entry.studentName}`
                          : entry.studentName}
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {entry.studentRoll} • Qty {entry.quantity}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Issued: {formatDateOnly(entry.issuedAt)} • Returned: {formatDateOnly(entry.returnedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <SectionLabel>Stock Information</SectionLabel>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>
                {component.quantityAvailable}
              </div>
              <div style={{ marginTop: '4px', fontSize: '20px', color: 'var(--text-secondary)' }}>
                of {component.quantityTotal} total
              </div>
              <div style={{ marginTop: '16px', height: '8px', borderRadius: '999px', backgroundColor: 'var(--bg-muted)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${stockPercent}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor:
                      component.quantityAvailable === 0
                        ? 'var(--danger)'
                        : component.quantityAvailable <= (component.lowStockThreshold ?? 0)
                          ? 'var(--warning)'
                          : 'var(--success)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>Low stock threshold: {component.lowStockThreshold ?? '—'}</div>
                <div>Max issue quantity: {component.maxIssueQuantity ?? '—'}</div>
                <div>Max issue days: {component.maxIssueDays ?? '—'} days</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <SectionLabel>Quick Edit</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  ['Total Quantity', 'quantityTotal'],
                  ['Low Stock Threshold', 'lowStockThreshold'],
                  ['Max Issue Quantity', 'maxIssueQuantity'],
                  ['Max Issue Days', 'maxIssueDays'],
                ].map(([label, key]) => (
                  <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                    <input
                      value={formState[key as keyof typeof formState]}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, [key]: event.target.value }))
                      }
                      type="number"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled
                  style={{
                    marginTop: '6px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Save is disabled here because the current UI-only scope does not include a component update endpoint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {error ? <div style={{ color: 'var(--danger)', fontSize: '13px', padding: '0 24px' }}>{error}</div> : null}
    </div>
  );
}
