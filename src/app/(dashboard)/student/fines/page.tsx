'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';

interface Fine {
  id: string;
  studentId: string;
  requestId: string;
  itemId?: string;
  reason: 'OVERDUE' | 'DAMAGED' | 'LOST';
  amount: number;
  daysOverdue?: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  issuedBy?: string;
  waivedBy?: string;
  waivedReason?: string;
  paidAt?: string;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default function MyFines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/fines');
      const data = await res.json();

      if (data.data) {
        setFines(data.data);
      }
    } catch (err) {
      console.error('Error fetching fines:', err);
      setError('Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#dc3545';
      case 'PAID':
        return '#28a745';
      case 'WAIVED':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'OVERDUE':
        return 'Overdue';
      case 'DAMAGED':
        return 'Damaged Item';
      case 'LOST':
        return 'Lost Item';
      default:
        return reason;
    }
  };

  const totalPending = fines
    .filter((f) => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.amount, 0);

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
            My Fines
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            View and manage your fines here
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

        {/* Summary Cards */}
        {fines.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Pending Fines */}
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Pending Amount
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc3545' }}>
                ₹{totalPending}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {fines.filter((f) => f.status === 'PENDING').length} fine{fines.filter((f) => f.status === 'PENDING').length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Paid Fines */}
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Paid Amount
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#28a745' }}>
                ₹{fines.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {fines.filter((f) => f.status === 'PAID').length} fine{fines.filter((f) => f.status === 'PAID').length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Waived Fines */}
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Waived Amount
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#6f42c1' }}>
                ₹{fines.filter((f) => f.status === 'WAIVED').reduce((sum, f) => sum + f.amount, 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {fines.filter((f) => f.status === 'WAIVED').length} fine{fines.filter((f) => f.status === 'WAIVED').length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Fines Table / List */}
        {fines.length === 0 ? (
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
                No fines recorded
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                You have no fines against your account
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Reason
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Amount
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Days Overdue
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Issued Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map((fine, idx) => (
                    <tr
                      key={fine.id}
                      style={{
                        borderBottom: idx < fines.length - 1 ? '1px solid var(--border)' : 'none',
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
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {getReasonLabel(fine.reason)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--accent)',
                        }}
                      >
                        ₹{fine.amount}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: `${getStatusColor(fine.status)}20`,
                            color: getStatusColor(fine.status),
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(fine.status),
                            }}
                          />
                          {fine.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {fine.daysOverdue ? `${fine.daysOverdue} days` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(fine.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
