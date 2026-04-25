'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquareWarning, Send } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';
type ConcernStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ConcernTargetType = 'FACULTY' | 'ALL_FACULTY' | 'ADMIN';

type ConcernListItem = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  targetType: ConcernTargetType;
  targetUserId: string | null;
  status: ConcernStatus;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
};

type ConcernReply = {
  id: string;
  concernId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
};

type ConcernDetail = ConcernListItem & {
  replies: ConcernReply[];
};

type FacultyOption = {
  id: string;
  name: string;
  email: string;
  department: string;
};

type Props = {
  role: UserRole;
};

const statusTabs: Array<{ key: 'ALL' | ConcernStatus; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

const statusChoices: ConcernStatus[] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const targetChoices: ConcernTargetType[] = ['FACULTY', 'ALL_FACULTY', 'ADMIN'];

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function statusTone(status: ConcernStatus) {
  if (status === 'OPEN') return { bg: 'var(--danger-light)', fg: 'var(--danger)' };
  if (status === 'ACKNOWLEDGED') return { bg: 'rgba(59, 130, 246, 0.18)', fg: '#60a5fa' };
  if (status === 'IN_PROGRESS') return { bg: 'rgba(245, 158, 11, 0.18)', fg: '#fbbf24' };
  if (status === 'RESOLVED') return { bg: 'rgba(34, 197, 94, 0.18)', fg: '#4ade80' };
  return { bg: 'rgba(148, 163, 184, 0.18)', fg: '#cbd5e1' };
}

export default function ConcernsPage({ role }: Props) {
  const { data: session } = useSession();
  const currentUserId = String((session?.user as { id?: string } | undefined)?.id || '');
  const [concerns, setConcerns] = useState<ConcernListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedConcern, setSelectedConcern] = useState<ConcernDetail | null>(null);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'ALL' | ConcernStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<ConcernTargetType>('FACULTY');
  const [targetUserId, setTargetUserId] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const loadConcerns = async (focusId?: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/concerns', { cache: 'no-store' });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.error || 'Failed to load concerns');
      }

      const rows = data.data as ConcernListItem[];
      setConcerns(rows);

      const nextId = focusId || selectedId || rows[0]?.id || '';
      setSelectedId(nextId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load concerns');
    } finally {
      setLoading(false);
    }
  };

  const loadConcernDetail = async (id: string) => {
    if (!id) {
      setSelectedConcern(null);
      return;
    }

    try {
      setDetailLoading(true);
      const response = await fetch(`/api/concerns/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to load concern');
      }
      setSelectedConcern(data.data as ConcernDetail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load concern');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadConcerns();
  }, []);

  useEffect(() => {
    if (role !== 'STUDENT') return;

    const loadFaculty = async () => {
      try {
        const response = await fetch('/api/faculty', { cache: 'no-store' });
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setFacultyOptions(data.data);
        }
      } catch {
        setFacultyOptions([]);
      }
    };

    void loadFaculty();
  }, [role]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedConcern(null);
      return;
    }

    void loadConcernDetail(selectedId);
  }, [selectedId]);

  const filteredConcerns = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return concerns.filter((concern) => {
      const matchesStatus = activeStatus === 'ALL' || concern.status === activeStatus;
      if (!matchesStatus) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        concern.title,
        concern.description,
        concern.creatorName,
        concern.targetType.replace('_', ' '),
        concern.status.replace('_', ' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeStatus, concerns, searchQuery]);

  const heading = role === 'STUDENT' ? 'My Concerns' : role === 'FACULTY' ? 'Student Concerns' : 'Admin Concerns';
  const subtitle =
    role === 'STUDENT'
      ? 'Raise issues with faculty or admin and track replies in one place.'
      : role === 'FACULTY'
        ? 'Review incoming student concerns, acknowledge them, and reply when needed.'
        : 'Review concerns that are targeted to admin only.';

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        title,
        description,
        targetType,
        targetUserId: targetType === 'FACULTY' ? targetUserId : null,
      };

      const response = await fetch('/api/concerns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to create concern');
      }

      setTitle('');
      setDescription('');
      setTargetType('FACULTY');
      setTargetUserId('');
      setComposeOpen(false);
      await loadConcerns(data.data.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create concern');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedConcern) return;
    try {
      setReplying(true);
      setError('');
      const response = await fetch(`/api/concerns/${selectedConcern.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }
      setReplyMessage('');
      await loadConcernDetail(selectedConcern.id);
      await loadConcerns(selectedConcern.id);
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusUpdate = async (status: ConcernStatus) => {
    if (!selectedConcern) return;
    try {
      setError('');
      const response = await fetch(`/api/concerns/${selectedConcern.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      await loadConcernDetail(selectedConcern.id);
      await loadConcerns(selectedConcern.id);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update status');
    }
  };

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{heading}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
        {role === 'STUDENT' ? (
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--accent)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Raise a Concern
          </button>
        ) : null}
      </div>

      {error ? (
        <div style={{ padding: '14px 16px', borderRadius: '14px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {statusTabs.map((tab) => {
          if (tab.key === 'ALL') {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatus(tab.key)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: activeStatus === tab.key ? 'var(--accent)' : 'var(--bg-surface)',
                  color: activeStatus === tab.key ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          }

          const tone = statusTone(tab.key);
          const active = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid transparent',
                backgroundColor: active ? tone.bg : 'var(--bg-surface)',
                color: active ? tone.fg : 'var(--text-secondary)',
                boxShadow: active ? `inset 0 0 0 1px ${tone.fg}` : 'inset 0 0 0 1px var(--border)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search concerns by title, description, creator, or status"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />

      {loading ? (
        <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Loading concerns...
        </div>
      ) : filteredConcerns.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No concerns found"
          subtitle={role === 'STUDENT' ? 'Raise your first concern to get started.' : 'There are no matching concerns right now.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'grid', gap: '14px', alignContent: 'start' }}>
            {filteredConcerns.map((concern) => {
              const tone = statusTone(concern.status);
              return (
                <button
                  key={concern.id}
                  type="button"
                  onClick={() => setSelectedId(concern.id)}
                  style={{
                    textAlign: 'left',
                    padding: '18px',
                    borderRadius: '16px',
                    border: selectedId === concern.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: selectedId === concern.id ? 'var(--accent-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{concern.title}</div>
                      <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {role === 'STUDENT' ? concern.targetType.replace('_', ' ') : concern.creatorName}
                      </div>
                    </div>
                    <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: tone.bg, color: tone.fg, fontSize: '12px', fontWeight: 700 }}>
                      {concern.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {concern.description.length > 120 ? `${concern.description.slice(0, 117)}...` : concern.description}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Updated {formatDate(concern.updatedAt)}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', minHeight: '480px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {!selectedConcern || detailLoading ? (
              <div style={{ color: 'var(--text-secondary)' }}>{detailLoading ? 'Loading conversation...' : 'Select a concern to view details.'}</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedConcern.title}</h2>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {selectedConcern.description}
                    </p>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Raised by {selectedConcern.creatorName} on {formatDate(selectedConcern.createdAt)}
                    </div>
                  </div>

                  {(role === 'FACULTY' || role === 'ADMIN') ? (
                    <select
                      value={selectedConcern.status}
                      onChange={(e) => void handleStatusUpdate(e.target.value as ConcernStatus)}
                      style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      {statusChoices.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-elevated)' }}>
                    Target: {selectedConcern.targetType.replace('_', ' ')}
                  </span>
                  <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-elevated)' }}>
                    <span style={{ color: statusTone(selectedConcern.status).fg }}>
                      Status: {selectedConcern.status.replace('_', ' ')}
                    </span>
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '12px', flex: 1, alignContent: 'start' }}>
                  {selectedConcern.replies.length === 0 ? (
                    <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No replies yet. Start the conversation below.
                    </div>
                  ) : (
                    selectedConcern.replies.map((reply) => {
                      const mine = reply.authorId === currentUserId;
                      return (
                        <div
                          key={reply.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            border: '1px solid var(--border)',
                            backgroundColor: mine ? 'var(--accent-light)' : 'var(--bg-elevated)',
                            alignSelf: mine ? 'end' : 'start',
                            maxWidth: '80%',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {reply.authorName} ({reply.authorRole})
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(reply.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reply.message}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    placeholder="Write a reply or acknowledgement"
                    style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                  />
                  <button
                    type="button"
                    disabled={replying || !replyMessage.trim()}
                    onClick={() => void handleReply()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: replying || !replyMessage.trim() ? 0.6 : 1 }}
                  >
                    <Send size={16} />
                    {replying ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {role === 'STUDENT' && composeOpen ? (
        <div
          onClick={() => setComposeOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 700,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(920px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'grid',
              gap: '16px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Raise a concern</h2>
                <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Send the concern to one faculty member, all faculty, or admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Concern title"
                style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as ConcernTargetType);
                  if (e.target.value !== 'FACULTY') setTargetUserId('');
                }}
                style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
              >
                {targetChoices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice === 'FACULTY' ? 'Specific Faculty' : choice === 'ALL_FACULTY' ? 'All Faculty' : 'Admin'}
                  </option>
                ))}
              </select>
              {targetType === 'FACULTY' ? (
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">Select faculty</option>
                  {facultyOptions.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.department})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your concern"
              rows={6}
              style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleCreate()}
                style={{ padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit Concern'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
