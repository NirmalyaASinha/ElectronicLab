'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader, ChevronDown } from 'lucide-react';

interface ComponentData {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantityTotal: number;
  quantityAvailable: number;
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

interface RequestItem {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
}

interface ComponentApiRecord {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  quantityTotal: number;
  quantityAvailable: number;
}

interface RequestApiRecord {
  id: string;
  studentName: string;
  studentRoll: string;
  status: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  items?: RequestItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const dynamic = 'force-dynamic';

export default function ComponentsInventory() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeIssueTab, setActiveIssueTab] = useState<'current' | 'past'>('current');

  useEffect(() => {
    fetchComponentsInventory();
  }, []);

  // Scroll modal into view when opened
  useEffect(() => {
    if (modalOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [modalOpen]);

  const fetchComponentsInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/components');
      const data = (await res.json()) as ApiResponse<ComponentApiRecord[]>;

      if (data.success && data.data) {
        const requestsRes = await fetch('/api/requests');
        const requestsData = (await requestsRes.json()) as ApiResponse<RequestApiRecord[]>;

        if (!requestsData.success) {
          setError('Failed to load request history');
          return;
        }

        const requests = requestsData.data || [];

        // Enrich components with issue data
        const enrichedComponents = await Promise.all(
          data.data.map(async (comp): Promise<ComponentData> => {
            const currentIssues: ComponentData['currentIssues'] = [];
            const pastIssues: ComponentData['pastIssues'] = [];

            requests.forEach((req) => {
              if (!req.items) return;
              req.items.forEach((item) => {
                if (item.componentId === comp.id) {
                  if (req.status === 'ISSUED') {
                    currentIssues.push({
                      requestId: req.id,
                      studentName: req.studentName,
                      studentRoll: req.studentRoll,
                      quantity: item.quantity,
                      issuedAt: req.issuedAt ?? '',
                      dueAt: req.dueAt ?? '',
                    });
                  } else if (req.status === 'RETURNED') {
                    pastIssues.push({
                      requestId: req.id,
                      studentName: req.studentName,
                      studentRoll: req.studentRoll,
                      quantity: item.quantity,
                      issuedAt: req.issuedAt ?? '',
                      returnedAt: req.returnedAt ?? '',
                    });
                  }
                }
              });
            });

            return {
              ...comp,
              description: comp.description ?? undefined,
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
    if (total === 0) return '#6c757d'; // Gray - no stock
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

        {/* Grid View */}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Component Card Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '14px' }}>
                    {component.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {component.category}
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                    padding: '16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {/* Total */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Total
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                      {component.quantityTotal}
                    </div>
                  </div>

                  {/* Available */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Available
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: getStatusColor(component.quantityAvailable, component.quantityTotal),
                      }}
                    >
                      {component.quantityAvailable}
                    </div>
                  </div>

                  {/* Issued */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Issued
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#fd7e14',
                      }}
                    >
                      {component.quantityTotal - component.quantityAvailable}
                    </div>
                  </div>
                </div>

                {/* Current Issues Count */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-elevated)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{component.currentIssues.length}</span> active issue
                  {component.currentIssues.length !== 1 ? 's' : ''}
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => {
                    setSelectedComponent(component);
                    setModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  View All Issues
                  <ChevronDown size={14} style={{ transition: 'transform 200ms' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Issues Detail Modal */}
        {modalOpen && selectedComponent && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
              overflowY: 'auto',
            }}
            onClick={() => {
              setModalOpen(false);
              setSelectedComponent(null);
            }}
          >
            {/* Modal Content */}
            <div
              ref={modalRef}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                maxWidth: '90vw',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {selectedComponent.name}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedComponent.category}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedComponent(null);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Stats Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Total
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
                    {selectedComponent.quantityTotal}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Available
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#28a745' }}>
                    {selectedComponent.quantityAvailable}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Issued
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#fd7e14' }}>
                    {selectedComponent.quantityTotal - selectedComponent.quantityAvailable}
                  </div>
                </div>
              </div>

              {/* Modal Body - Scrollable Tabs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
                  <button
                    onClick={() => setActiveIssueTab('current')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: activeIssueTab === 'current' ? 'white' : 'var(--text-secondary)',
                      backgroundColor: activeIssueTab === 'current' ? 'var(--accent)' : 'var(--bg-surface)',
                      borderRight: '1px solid var(--border)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Currently Issued ({selectedComponent.currentIssues.length})
                  </button>
                  <button
                    onClick={() => setActiveIssueTab('past')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: activeIssueTab === 'past' ? 'white' : 'var(--text-secondary)',
                      backgroundColor: activeIssueTab === 'past' ? 'var(--accent)' : 'var(--bg-surface)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Past Issues ({selectedComponent.pastIssues.length})
                  </button>
                </div>

                {/* Content Tabs - Scrollable */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {/* Current Issues Tab */}
                  <div style={{ height: '100%', overflowY: 'auto', padding: '16px', display: activeIssueTab === 'current' ? 'block' : 'none' }}>
                    {selectedComponent.currentIssues.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '14px' }}>No active issues currently</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedComponent.currentIssues.map((issue) => (
                          <div
                            key={issue.requestId}
                            style={{
                              padding: '16px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div>
                                <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                  {issue.studentName}
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  Roll: {issue.studentRoll}
                                </p>
                              </div>
                              <div
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: '#fd7e1420',
                                  color: '#fd7e14',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                {issue.quantity}x
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Issued Date
                                </p>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {new Date(issue.issuedAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Due Date
                                </p>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {new Date(issue.dueAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Issues Tab Content */}
                <div style={{ height: '100%', overflowY: 'auto', padding: '16px', display: activeIssueTab === 'past' ? 'block' : 'none' }}>
                  {selectedComponent.pastIssues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                      <p style={{ fontSize: '14px' }}>No past issues</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedComponent.pastIssues.map((issue) => (
                        <div
                          key={issue.requestId}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                {issue.studentName}
                              </h3>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Roll: {issue.studentRoll}
                              </p>
                            </div>
                            <div
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#28a74520',
                                color: '#28a745',
                                fontWeight: 600,
                                fontSize: '12px',
                              }}
                            >
                              ✓ Returned
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Quantity
                              </p>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {issue.quantity}x
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Issued
                              </p>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {new Date(issue.issuedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Returned
                              </p>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#28a745' }}>
                                {new Date(issue.returnedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
