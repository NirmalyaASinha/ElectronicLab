'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader, ChevronDown } from 'lucide-react';

interface ComponentData {
  id: string;
  name: string;
  category: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  issuedQuantity: number;
  currentIssues: Array<{
    requestId: string;
    studentName: string;
    studentRoll: string;
    quantity: number;
    issuedAt: string;
    dueAt: string;
  }>;
  pastIssues: Array<{
    requestId: string;
    studentName: string;
    studentRoll: string;
    quantity: number;
    issuedAt: string;
    returnedAt: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default function ComponentsInventory() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchComponentsInventory();
  }, []);

  const fetchComponentsInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/components');
      const data = await res.json();

      if (data.success && data.data) {
        // Enrich components with issue data
        const enrichedComponents = await Promise.all(
          data.data.map(async (comp: any) => {
            const requestsRes = await fetch('/api/requests');
            const requestsData = await requestsRes.json();

            if (!requestsData.success) return comp;

            const requests = requestsData.data || [];
            let issuedQuantity = 0;
            const currentIssues: any[] = [];
            const pastIssues: any[] = [];

            requests.forEach((req: any) => {
              if (!req.items) return;
              req.items.forEach((item: any) => {
                if (item.componentId === comp.id) {
                  if (req.status === 'ISSUED') {
                    issuedQuantity += item.quantity;
                    currentIssues.push({
                      requestId: req.id,
                      studentName: req.studentName,
                      studentRoll: req.studentRoll,
                      quantity: item.quantity,
                      issuedAt: req.issuedAt,
                      dueAt: req.dueAt,
                    });
                  } else if (req.status === 'RETURNED') {
                    pastIssues.push({
                      requestId: req.id,
                      studentName: req.studentName,
                      studentRoll: req.studentRoll,
                      quantity: item.quantity,
                      issuedAt: req.issuedAt,
                      returnedAt: req.returnedAt,
                    });
                  }
                }
              });
            });

            return {
              ...comp,
              issuedQuantity,
              availableQuantity: comp.quantity - issuedQuantity,
              totalQuantity: comp.quantity,
              currentIssues,
              pastIssues,
            };
          })
        );

        setComponents(enrichedComponents);
      } else {
        setError('Failed to load components');
      }
    } catch (err) {
      console.error('Error fetching components:', err);
      setError('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(components.map((c) => c.category)));
  const filteredComponents =
    filterCategory === 'all' ? components : components.filter((c) => c.category === filterCategory);

  const getStatusColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return '#dc3545'; // Red - out of stock
    if (percentage < 30) return '#fd7e14'; // Orange - low stock
    return '#28a745'; // Green - in stock
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
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Components Inventory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            View all components, their availability, and issue history
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#dc3545',
              border: '1px solid #dc3545',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} style={{ color: 'white', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: 'white', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: filterCategory === 'all' ? 'var(--accent)' : 'var(--bg-surface)',
              color: filterCategory === 'all' ? 'white' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: filterCategory === cat ? 'var(--accent)' : 'var(--bg-surface)',
                color: filterCategory === cat ? 'white' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Components List */}
        {filteredComponents.length === 0 ? (
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
                No components found
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                No components available in this category
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                {/* Component Header */}
                <div
                  onClick={() => setExpandedComponent(expandedComponent === component.id ? null : component.id)}
                  style={{
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 200px 200px 200px 40px',
                    gap: '16px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-surface)',
                    transition: 'background-color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  {/* Component Name & Category */}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '14px' }}>
                      {component.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {component.category}
                    </div>
                  </div>

                  {/* Total Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Total
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                      {component.totalQuantity}
                    </div>
                  </div>

                  {/* Available Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Available
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: getStatusColor(component.availableQuantity, component.totalQuantity),
                      }}
                    >
                      {component.availableQuantity}
                    </div>
                  </div>

                  {/* Issued Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Issued
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#fd7e14' }}>
                      {component.issuedQuantity}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ChevronDown
                      size={20}
                      style={{
                        color: 'var(--text-secondary)',
                        transition: 'transform 200ms',
                        transform: expandedComponent === component.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedComponent === component.id && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0',
                    }}
                  >
                    {/* Current Issues */}
                    <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Currently Issued ({component.currentIssues.length})
                      </div>
                      {component.currentIssues.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No active issues</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {component.currentIssues.map((issue) => (
                            <div
                              key={issue.requestId}
                              style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                                {issue.studentName}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Roll: {issue.studentRoll} • Qty: {issue.quantity}x
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {new Date(issue.issuedAt).toLocaleDateString('en-IN')} to{' '}
                                {new Date(issue.dueAt).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Past Issues */}
                    <div style={{ padding: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Past Issues ({component.pastIssues.length})
                      </div>
                      {component.pastIssues.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No past issues</p>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                          }}
                        >
                          {component.pastIssues.map((issue) => (
                            <div
                              key={issue.requestId}
                              style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                                {issue.studentName}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Roll: {issue.studentRoll} • Qty: {issue.quantity}x
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '4px' }}>
                                Returned: {new Date(issue.returnedAt).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
