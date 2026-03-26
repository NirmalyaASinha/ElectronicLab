'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertTriangle, ChevronLeft, Minus, Plus, RotateCcw } from 'lucide-react';
import {
  RequestDetailLayout,
  RequestDetailSkeleton,
  type FacultySummary,
  type FineItem,
  type RequestListItem,
  formatDateOnly,
  getEffectiveStatus,
  toStatus,
} from '@/components/shared/request-pattern';
import SectionLabel from '@/components/ui/SectionLabel';

type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

interface FacultyApiItem {
  id: string;
  name: string;
  department: string;
  email: string;
}

interface ReturnDraft {
  quantity: number;
  condition: 'Good' | 'Damaged' | 'Lost';
  remarks: string;
}

const getFineAmount = (condition: ReturnDraft['condition'], quantity: number) => {
  if (condition === 'Damaged') return quantity * 50;
  if (condition === 'Lost') return quantity * 200;
  return 0;
};

export const dynamic = 'force-dynamic';

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [fines, setFines] = useState<FineItem[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returnDraft, setReturnDraft] = useState<Record<string, ReturnDraft>>({});

  const role = ((session?.user as { role?: string } | undefined)?.role ?? 'STUDENT') as Role;

  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const requestsPromise = fetch('/api/requests', { cache: 'no-store' }).then((response) => response.json());
        const finesPromise = fetch('/api/fines', { cache: 'no-store' }).then((response) => response.json());
        const facultyPromise = fetch('/api/faculty', { cache: 'no-store' }).then((response) => response.json());

        const [requestsData, finesData, facultyData] = await Promise.all([
          requestsPromise,
          finesPromise,
          facultyPromise,
        ]);

        setRequests(
          ((requestsData.data ?? []) as RequestListItem[]).map((request) => ({
            ...request,
            status: toStatus(request.status),
          }))
        );
        setFines((finesData.data ?? []) as FineItem[]);
        setFacultyList((facultyData.data ?? []) as FacultyApiItem[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load request detail');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [status]);

  const request = useMemo(
    () => requests.find((entry) => entry.id === params.id) ?? null,
    [params.id, requests]
  );

  useEffect(() => {
    if (!request) return;
    setReturnDraft(
      request.items.reduce<Record<string, ReturnDraft>>((accumulator, item) => {
        accumulator[item.id] = {
          quantity: 0,
          condition: 'Good',
          remarks: '',
        };
        return accumulator;
      }, {})
    );
  }, [request]);

  const fine = useMemo(
    () => fines.find((entry) => entry.requestId === params.id) ?? null,
    [fines, params.id]
  );

  const faculty: FacultySummary | null = useMemo(() => {
    // For FACULTY users, show their own info
    if (role === 'FACULTY' && session?.user?.name) {
      return {
        name: session.user.name,
        department: (session.user as { department?: string }).department,
        email: session.user.email ?? undefined,
      };
    }

    // For ADMIN users, no faculty summary needed
    if (role === 'ADMIN') {
      return null;
    }

    // For STUDENT users, find the faculty assigned to this specific request
    if (role === 'STUDENT' && request) {
      const requestFacultyId = request.facultyId;
      if (requestFacultyId && facultyList.length > 0) {
        const assignedFaculty = facultyList.find(fac => fac.id === requestFacultyId);
        if (assignedFaculty) {
          return {
            name: assignedFaculty.name,
            department: assignedFaculty.department,
            email: assignedFaculty.email,
          };
        }
      }
    }

    // Fallback to first faculty if no match found
    const firstFaculty = facultyList[0];
    return firstFaculty
      ? {
          name: firstFaculty.name,
          department: firstFaculty.department,
          email: firstFaculty.email,
        }
      : null;
  }, [facultyList, role, session, request]);

  const refreshRequests = async () => {
    const response = await fetch('/api/requests', { cache: 'no-store' });
    const data = (await response.json()) as { data?: RequestListItem[] };
    setRequests(
      (data.data ?? []).map((entry) => ({
        ...entry,
        status: toStatus(entry.status),
      }))
    );
  };

  const handleApprove = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to approve request');
      await refreshRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', rejectionReason: rejectReason }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to reject request');
      setRejectOpen(false);
      setRejectReason('');
      await refreshRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssue = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${request.id}/issue`, { method: 'POST' });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to issue request');
      setIssueConfirmOpen(false);
      await refreshRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to issue request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!request) return;
    const returnedItems = request.items
      .map((item) => ({
        id: item.id,
        componentId: item.componentId,
        quantity: returnDraft[item.id]?.quantity ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    if (returnedItems.length === 0) {
      setError('Please select at least one quantity to return');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${request.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnedItems }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to process return');
      setReturnOpen(false);
      await refreshRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  const actionCard = (() => {
    if (!request) return null;
    const effectiveStatus = getEffectiveStatus(request);

    if (role === 'FACULTY' && effectiveStatus === 'PENDING') {
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <SectionLabel>Actions</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Approve Request
            </button>
            <button
              type="button"
              onClick={() => setRejectOpen((current) => !current)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--danger)', backgroundColor: 'transparent', color: 'var(--danger)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reject Request
            </button>
            <div
              style={{
                maxHeight: rejectOpen ? '180px' : '0',
                overflow: 'hidden',
                transition: 'max-height 200ms ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: rejectOpen ? '4px' : '0' }}>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Reason for rejection (required)"
                  style={{ minHeight: '96px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', padding: '12px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setRejectOpen(false)} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button type="button" disabled={!rejectReason.trim() || submitting} onClick={handleReject} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--danger)', color: 'white', opacity: !rejectReason.trim() ? 0.6 : 1 }}>
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (role === 'FACULTY' && effectiveStatus === 'APPROVED') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <SectionLabel>Actions</SectionLabel>
          <button
            type="button"
            onClick={() => setIssueConfirmOpen((current) => !current)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Mark as Issued
          </button>
          {issueConfirmOpen ? (
            <div style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Confirm issuing to {request.studentName}?</div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Due date will be: {formatDateOnly(dueDate.toISOString())}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIssueConfirmOpen(false)} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="button" disabled={submitting} onClick={handleIssue} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--accent)', color: 'white' }}>
                  Confirm Issue
                </button>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (role === 'FACULTY' && (effectiveStatus === 'ISSUED' || effectiveStatus === 'OVERDUE')) {
      const totalFinePreview = request.items.reduce((sum, item) => {
        const itemDraft = returnDraft[item.id];
        return sum + getFineAmount(itemDraft?.condition ?? 'Good', itemDraft?.quantity ?? 0);
      }, 0);

      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <SectionLabel>Actions</SectionLabel>
          <button
            type="button"
            onClick={() => setReturnOpen((current) => !current)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--success)', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Process Return
          </button>
          {returnOpen ? (
            <div style={{ marginTop: '16px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <RotateCcw size={24} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Process Return
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Record condition of each returned component
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {request.items.map((item) => {
                  const itemDraft = returnDraft[item.id] ?? {
                    quantity: 0,
                    condition: 'Good' as const,
                    remarks: '',
                  };
                  const finePreview = getFineAmount(itemDraft.condition, itemDraft.quantity);

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.name}
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {item.category}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--accent-light)',
                            color: 'var(--accent)',
                            fontSize: '12px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Issued: {item.quantity}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <SectionLabel>Quantity Returned</SectionLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            disabled={itemDraft.quantity === 0}
                            onClick={() =>
                              setReturnDraft((current) => ({
                                ...current,
                                [item.id]: {
                                  ...itemDraft,
                                  quantity: Math.max(0, itemDraft.quantity - 1),
                                },
                              }))
                            }
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '999px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              cursor: itemDraft.quantity === 0 ? 'not-allowed' : 'pointer',
                              opacity: itemDraft.quantity === 0 ? 0.45 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <div
                            style={{
                              minWidth: '40px',
                              textAlign: 'center',
                              fontSize: '20px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {itemDraft.quantity}
                          </div>
                          <button
                            type="button"
                            disabled={itemDraft.quantity >= item.quantity}
                            onClick={() =>
                              setReturnDraft((current) => ({
                                ...current,
                                [item.id]: {
                                  ...itemDraft,
                                  quantity: Math.min(item.quantity, itemDraft.quantity + 1),
                                },
                              }))
                            }
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '999px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              cursor: itemDraft.quantity >= item.quantity ? 'not-allowed' : 'pointer',
                              opacity: itemDraft.quantity >= item.quantity ? 0.45 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <SectionLabel>Condition</SectionLabel>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: '8px',
                          }}
                        >
                          {([
                            { label: 'Good', icon: '✓' },
                            { label: 'Damaged', icon: '⚠' },
                            { label: 'Lost', icon: '✗' },
                          ] as const).map((conditionOption) => {
                            const selected = itemDraft.condition === conditionOption.label;
                            const palette =
                              conditionOption.label === 'Good'
                                ? { border: 'var(--success)', bg: 'var(--success-light)', color: 'var(--success)' }
                                : conditionOption.label === 'Damaged'
                                  ? { border: 'var(--warning)', bg: 'var(--warning-light)', color: 'var(--warning)' }
                                  : { border: 'var(--danger)', bg: 'var(--danger-light)', color: 'var(--danger)' };

                            return (
                              <button
                                key={conditionOption.label}
                                type="button"
                                onClick={() =>
                                  setReturnDraft((current) => ({
                                    ...current,
                                    [item.id]: {
                                      ...itemDraft,
                                      condition: conditionOption.label,
                                    },
                                  }))
                                }
                                style={{
                                  border: `1px solid ${selected ? palette.border : 'var(--border)'}`,
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '8px 12px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  transition: 'all 150ms',
                                  backgroundColor: selected ? palette.bg : 'var(--bg-surface)',
                                  color: selected ? palette.color : 'var(--text-secondary)',
                                }}
                              >
                                {conditionOption.icon} {conditionOption.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '10px',
                          maxHeight: itemDraft.condition === 'Damaged' || itemDraft.condition === 'Lost' ? '120px' : '0',
                          overflow: 'hidden',
                          transition: 'max-height 200ms ease',
                        }}
                      >
                        <div style={{ paddingTop: itemDraft.condition === 'Damaged' || itemDraft.condition === 'Lost' ? '2px' : '0' }}>
                          <SectionLabel>Remarks (optional)</SectionLabel>
                          <textarea
                            rows={2}
                            value={itemDraft.remarks}
                            onChange={(event) =>
                              setReturnDraft((current) => ({
                                ...current,
                                [item.id]: {
                                  ...itemDraft,
                                  remarks: event.target.value,
                                },
                              }))
                            }
                            placeholder="Describe the damage or loss..."
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              resize: 'none',
                            }}
                          />
                        </div>
                      </div>

                      {itemDraft.quantity > 0 && (itemDraft.condition === 'Damaged' || itemDraft.condition === 'Lost') ? (
                        <div
                          style={{
                            marginTop: '10px',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: itemDraft.condition === 'Damaged' ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: itemDraft.condition === 'Damaged' ? 'var(--warning)' : 'var(--danger)',
                            fontSize: '12px',
                          }}
                        >
                          <AlertTriangle size={14} />
                          <span>
                            A fine of Rs. {finePreview} will be issued for {itemDraft.condition.toLowerCase()} component
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  position: 'sticky',
                  bottom: 0,
                  borderTop: '1px solid var(--border)',
                  padding: '14px 20px',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: totalFinePreview > 0 ? 600 : 500,
                    color: totalFinePreview > 0 ? 'var(--danger)' : 'var(--success)',
                  }}
                >
                  {totalFinePreview > 0 ? `Total fines: Rs. ${totalFinePreview}` : 'No fines'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setReturnOpen(false)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleReturn}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'var(--success)',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    <RotateCcw size={14} />
                    Submit Return
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (role === 'ADMIN') {
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <SectionLabel>Actions</SectionLabel>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            This request is managed by faculty in the current workflow. Admin view is read-only.
          </div>
        </div>
      );
    }

    if (role === 'STUDENT' && getEffectiveStatus(request) === 'PENDING') {
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <SectionLabel>Actions</SectionLabel>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Request cancellation is not available through the current API.
          </div>
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <SectionLabel>Actions</SectionLabel>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          This request has been {getEffectiveStatus(request).toLowerCase()}.
        </div>
      </div>
    );
  })();

  if (status === 'loading' || loading) {
    return <RequestDetailSkeleton />;
  }

  if (!request) {
    return <div style={{ padding: '24px', color: 'var(--danger)' }}>{error || 'Request not found'}</div>;
  }

  return (
    <div className="animate-page-enter">
      {error ? (
        <div style={{ maxWidth: '900px', margin: '0 auto 16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      ) : null}

      <RequestDetailLayout
        request={request}
        viewerRole={role}
        faculty={faculty}
        fine={fine}
        topAction={
          <button
            type="button"
            onClick={() => router.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        }
        actionCard={actionCard}
      />
    </div>
  );
}
