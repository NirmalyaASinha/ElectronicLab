'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardX, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';

interface InventoryComponent {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  modelNumber?: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

function InventoryCardSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '88px', height: '10px', borderRadius: '999px', backgroundColor: 'var(--bg-muted)' }} />
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ width: '70%', height: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)' }} />
        <div style={{ width: '48%', height: '12px', marginTop: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)' }} />
        <div style={{ width: '100%', height: '12px', marginTop: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)' }} />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function AdminInventoryPage() {
  const router = useRouter();
  const [components, setComponents] = useState<InventoryComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/components', { cache: 'no-store' });
        const data = (await response.json()) as ApiResponse<InventoryComponent[]>;

        if (!data.success || !data.data) {
          throw new Error('Failed to load inventory');
        }

        setComponents(data.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    void loadInventory();
  }, []);

  const sortedComponents = useMemo(
    () => [...components].sort((left, right) => left.name.localeCompare(right.name)),
    [components]
  );

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Inventory</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Browse components and inspect stock details
        </p>
      </div>

      {error ? (
        <div style={{ padding: '14px 16px', borderRadius: '14px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <InventoryCardSkeleton key={index} />
          ))}
        </div>
      ) : sortedComponents.length === 0 ? (
        <EmptyState
          icon={ClipboardX}
          title="No components found"
          subtitle="Inventory items will appear here once they are added"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedComponents.map((component) => (
            <div
              key={component.id}
              onClick={() => router.push(`/admin/inventory/${component.id}`)}
              style={{
                minWidth: 0,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  #{component.id.slice(0, 8)}
                </div>
                <StatusBadge status={component.status} size="sm" />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {component.name}
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {component.category}
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {component.description || 'No description available'}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{component.quantityAvailable} available</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={12} />
                  {component.quantityTotal} total
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
