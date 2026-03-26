'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import DetailSheet from '@/components/shared/DetailSheet';

interface InventoryComponent {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  modelNumber?: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  specs?: Record<string, unknown> | null;
}

interface RequestItem {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  returnedQty?: number;
}

interface RequestRecord {
  id: string;
  studentName: string;
  studentRoll: string;
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  items: RequestItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const dynamic = 'force-dynamic';

export default function Inventory() {
  const [components, setComponents] = useState<InventoryComponent[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError('');

        const [componentsResponse, requestsResponse] = await Promise.all([
          fetch('/api/components', { cache: 'no-store' }),
          fetch('/api/requests', { cache: 'no-store' }),
        ]);

        const componentsData = (await componentsResponse.json()) as ApiResponse<InventoryComponent[]>;
        const requestsData = (await requestsResponse.json()) as ApiResponse<RequestRecord[]>;

        if (!componentsData.success || !componentsData.data) {
          throw new Error('Failed to load components');
        }

        if (!requestsData.success || !requestsData.data) {
          throw new Error('Failed to load request history');
        }

        setComponents(componentsData.data);
        setRequests(requestsData.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    void loadInventory();
  }, []);

  const selectedComponent = useMemo(
    () => components.find((component) => component.id === selectedComponentId) ?? null,
    [components, selectedComponentId]
  );

  const selectedHistory = useMemo(() => {
    if (!selectedComponent) {
      return [];
    }

    return requests
      .flatMap((request) =>
        request.items
          .filter((item) => item.componentId === selectedComponent.id)
          .map((item) => ({
            id: `${request.id}-${item.id}`,
            requestId: request.id,
            studentName: request.studentName,
            studentRoll: request.studentRoll,
            quantity: item.quantity,
            returnedQty: item.returnedQty ?? 0,
            status: request.status,
            purpose: request.purpose,
            date:
              request.returnedAt ??
              request.issuedAt ??
              request.approvedAt ??
              request.requestedAt,
          }))
      )
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [requests, selectedComponent]);

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
        {error ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
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
        ) : null}

        <div
          style={{
            borderRadius: '20px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) 120px',
              gap: '16px',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <div>Component</div>
            <div>Total</div>
            <div>Available</div>
            <div>Actions</div>
          </div>

          {components.map((component) => (
            <div
              key={component.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) 120px',
                gap: '16px',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {component.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {component.category}
                  {component.modelNumber ? ` • ${component.modelNumber}` : ''}
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {component.quantityTotal}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                {component.quantityAvailable}
              </div>
              <button
                onClick={() => setSelectedComponentId(component.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      <DetailSheet
        open={selectedComponent !== null}
        onClose={() => setSelectedComponentId(null)}
        title={selectedComponent?.name ?? 'Component Details'}
        subtitle={selectedComponent?.category}
      >
        {selectedComponent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Model
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {selectedComponent.modelNumber ?? 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Stock
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {selectedComponent.quantityAvailable} available of {selectedComponent.quantityTotal}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Description
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {selectedComponent.description ?? 'No description available.'}
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Full Specs
              </div>

              {selectedComponent.specs && Object.keys(selectedComponent.specs).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(selectedComponent.specs).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {key}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                  No structured specs stored for this component.
                </p>
              )}
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Quantity History
              </div>

              {selectedHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedHistory.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {entry.studentName} ({entry.studentRoll})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {entry.purpose}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                            Qty {entry.quantity}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(entry.date).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                  No request history found for this component yet.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => alert('Edit component flow is not configured yet.')}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Edit Component
            </button>
          </div>
        ) : null}
      </DetailSheet>
    </div>
  );
}
