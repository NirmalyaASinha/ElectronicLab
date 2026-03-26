'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Component {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  returnedQty?: number;
}

interface CompactRequestCardProps {
  request: {
    id: string;
    studentName: string;
    studentRoll: string;
    studentDept: string;
    purpose: string;
    status: string;
    issuedAt?: string;
    dueAt?: string;
    returnedAt?: string;
    items: Component[];
  };
  mode?: 'view' | 'returns' | 'approvals'; // 'view' for issued/approvals, 'returns' for return processing, 'approvals' for approval
  onExpandChange?: (expanded: boolean) => void;
  selectedItems?: { [key: number]: number };
  onQuantityChange?: (itemIndex: number, quantity: number) => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
  onViewDetails?: () => void;
}

export default function CompactRequestCard({
  request,
  mode = 'view',
  onExpandChange,
  selectedItems = {},
  onQuantityChange,
  onSubmit,
  onApprove,
  onReject,
  isProcessing = false,
  onViewDetails,
}: CompactRequestCardProps) {
  const [expandedModal, setExpandedModal] = useState(false);
  const validItems = request.items.filter((item) => item && item.name);

  const handleExpandModal = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    setExpandedModal(true);
    onExpandChange?.(true);
  };

  const handleCloseModal = () => {
    setExpandedModal(false);
    onExpandChange?.(false);
  };

  return (
    <>
      {/* Compact Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateRows: (mode === 'approvals' || mode === 'view') ? '1fr auto' : '1fr',
          gap: '0',
        }}
      >
        {/* Main Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0',
            height: '320px',
          }}
        >
        {/* Left Side: Student Information */}
        <div
          style={{
            padding: '20px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          {/* Student Details */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Student Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {request.studentName}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Roll Number
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                  {request.studentRoll}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Department
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {request.studentDept}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Purpose
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {request.purpose}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {request.issuedAt && (
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Issued Date
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {new Date(request.issuedAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            )}
            {request.dueAt && (
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Due Date
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {new Date(request.dueAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            )}
            {request.returnedAt && (
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Returned Date
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                  {new Date(request.returnedAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Items List with Scroll */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {/* Header */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Issued Items ({validItems.length})
            </div>
          </div>

          {/* Scrollable Items List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '8px',
            }}
          >
            {validItems.map((item, validIndex) => {
              return (
                <div
                  key={item.id || validIndex}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-muted)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.category} • Issued: <span style={{ fontWeight: 600 }}>{item.quantity}x</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand Button */}
          <button
            onClick={handleExpandModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
          >
            View Details
            <ChevronDown size={14} />
          </button>
        </div>
        </div>

        {/* Footer Actions (for approvals and issued mode) */}
        {(mode === 'approvals' || mode === 'view') && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            {mode === 'approvals' && (
              <>
                <button
                  onClick={() => onReject?.()}
                  disabled={isProcessing}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--danger)',
                    backgroundColor: 'transparent',
                    color: 'var(--danger)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.backgroundColor = 'var(--danger-light)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove?.()}
                  disabled={isProcessing}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </>
            )}
            {mode === 'view' && (
              <button
                onClick={() => onSubmit?.()}
                disabled={isProcessing}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  transition: 'opacity 200ms ease',
                }}
              >
                {isProcessing ? 'Processing...' : 'Issue Component'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {expandedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                All Issued Items
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content: Table */}
            <div style={{ padding: '20px', overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                      Component Name
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                      Quantity
                    </th>
                    {mode === 'returns' && (
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                        Return Qty
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {validItems.map((item, validIndex) => {
                    const originalIndex = request.items.findIndex((i) => i && i.id === item.id);
                    return (
                      <tr
                        key={item.id || validIndex}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: validIndex % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-muted)',
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                          {item.category}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                          {item.quantity}
                        </td>
                        {mode === 'returns' && (
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedItems?.[originalIndex] || 0}
                              onChange={(e) =>
                                onQuantityChange?.(originalIndex, parseInt(e.target.value) || 0)
                              }
                              style={{
                                width: '60px',
                                padding: '6px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                textAlign: 'center',
                              }}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            {mode === 'returns' && (
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSubmit?.();
                    handleCloseModal();
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Mark as Returned'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
