'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  Clock3,
  GraduationCap,
  Mail,
  Package,
  RotateCcw,
  Send,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import SectionLabel from '@/components/ui/SectionLabel';
import StatusBadge from '@/components/ui/StatusBadge';

export interface RequestListItem {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  studentEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  rejectionReason?: string;
  items: RequestItem[];
}

export interface RequestItem {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  returnedQty?: number;
  condition?: string;
}

export interface FineItem {
  id: string;
  requestId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  reason: 'OVERDUE' | 'DAMAGED' | 'LOST';
  createdAt: string;
}

export interface FacultySummary {
  name?: string;
  department?: string;
  employeeId?: string;
  email?: string;
}

interface RequestGridCardProps {
  request: RequestListItem;
  href: string;
  viewerRole: 'STUDENT' | 'FACULTY' | 'ADMIN';
}

interface RequestDetailLayoutProps {
  request: RequestListItem;
  viewerRole: 'STUDENT' | 'FACULTY' | 'ADMIN';
  faculty?: FacultySummary | null;
  fine?: FineItem | null;
  topAction?: ReactNode;
  actionCard?: ReactNode;
}

interface DetailCardProps {
  title: string;
  children: ReactNode;
}

interface Milestone {
  label: string;
  date: Date | null;
  status: 'done' | 'active' | 'pending' | 'skipped';
  note?: string;
  icon: LucideIcon;
}

const STATUS_COLORS: Record<RequestListItem['status'], string> = {
  PENDING: 'var(--info)',
  APPROVED: 'var(--success)',
  ISSUED: 'var(--accent)',
  OVERDUE: 'var(--danger)',
  RETURNED: 'var(--neutral)',
  REJECTED: 'var(--danger)',
  CANCELLED: 'var(--neutral)',
};

const isOverdueDate = (date?: string) => {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
};

export const toStatus = (status: string): RequestListItem['status'] => {
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED' || status === 'ISSUED' || status === 'RETURNED' || status === 'OVERDUE' || status === 'CANCELLED') {
    return status;
  }
  return 'PENDING';
};

export const getEffectiveStatus = (request: RequestListItem): RequestListItem['status'] => {
  if ((request.status === 'ISSUED' || request.status === 'OVERDUE') && request.dueAt && isOverdueDate(request.dueAt) && !request.returnedAt) {
    return 'OVERDUE';
  }
  return request.status;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
};

export const formatDateOnly = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
};

export const getRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

export const getDaysOverdue = (value?: string) => {
  if (!value) return 0;
  const dueDate = new Date(value);
  const diffMs = Date.now() - dueDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const getTimeline = (request: RequestListItem): Milestone[] => {
  const effectiveStatus = getEffectiveStatus(request);
  const rejected = effectiveStatus === 'REJECTED';
  const overdueDays = getDaysOverdue(request.dueAt);

  if (rejected) {
    return [
      { label: 'Requested', date: new Date(request.requestedAt), status: 'done', icon: Send },
      {
        label: 'Rejected',
        date: request.approvedAt ? new Date(request.approvedAt) : null,
        status: 'skipped',
        note: request.rejectionReason || 'Rejected by faculty',
        icon: UserCheck,
      },
      { label: 'Issued', date: null, status: 'skipped', icon: Package },
      { label: 'Due Date', date: request.dueAt ? new Date(request.dueAt) : null, status: 'skipped', icon: Calendar },
      { label: 'Returned', date: null, status: 'skipped', icon: RotateCcw },
    ];
  }

  return [
    { label: 'Requested', date: new Date(request.requestedAt), status: 'done', icon: Send },
    {
      label: 'Reviewed',
      date: request.approvedAt ? new Date(request.approvedAt) : null,
      status: request.approvedAt ? 'done' : 'active',
      icon: UserCheck,
    },
    {
      label: 'Issued',
      date: request.issuedAt ? new Date(request.issuedAt) : null,
      status: request.issuedAt ? 'done' : 'pending',
      icon: Package,
    },
    {
      label: 'Due Date',
      date: request.dueAt ? new Date(request.dueAt) : null,
      status: request.returnedAt ? 'done' : effectiveStatus === 'OVERDUE' ? 'active' : request.issuedAt ? 'active' : 'pending',
      note: effectiveStatus === 'OVERDUE' && overdueDays > 0 ? `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue` : undefined,
      icon: Calendar,
    },
    {
      label: 'Returned',
      date: request.returnedAt ? new Date(request.returnedAt) : null,
      status: request.returnedAt ? 'done' : 'pending',
      icon: RotateCcw,
    },
  ];
};

const detailCardStyle: CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-sm)',
};

function DetailCard({ title, children }: DetailCardProps) {
  return (
    <div style={detailCardStyle}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
      <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function RequestGridCard({
  request,
  href,
  viewerRole,
}: RequestGridCardProps) {
  const effectiveStatus = getEffectiveStatus(request);
  const dueSoon =
    request.dueAt &&
    new Date(request.dueAt).getTime() - Date.now() <= 2 * 24 * 60 * 60 * 1000 &&
    new Date(request.dueAt).getTime() > Date.now();
  const totalItems = request.items.reduce((sum, item) => sum + item.quantity, 0);
  const title =
    viewerRole === 'STUDENT'
      ? request.status === 'PENDING'
        ? 'Awaiting faculty review'
        : request.status === 'REJECTED'
          ? 'Request rejected'
          : 'Request in progress'
      : request.studentName;

  const subline =
    viewerRole === 'STUDENT'
      ? request.dueAt
        ? `Due ${formatDateOnly(request.dueAt)}`
        : request.studentDept
      : `${request.studentRoll} • ${request.studentDept}`;

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          minWidth: 0,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${STATUS_COLORS[effectiveStatus]}`,
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
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            #{request.id.slice(0, 8)}
          </div>
          <StatusBadge status={effectiveStatus} size="sm" />
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: effectiveStatus === 'OVERDUE' ? 'rgba(220, 53, 69, 0.02)' : 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>{subline}</div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {request.purpose}
          </div>
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock3 size={12} />
              {getRelativeTime(request.requestedAt)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Package size={12} />
                {totalItems} component(s)
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {(request.issuedAt || request.dueAt) ? (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '12px',
                color:
                  effectiveStatus === 'OVERDUE'
                    ? 'var(--danger)'
                    : dueSoon
                      ? 'var(--warning)'
                      : 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} />
                Due: {formatDateOnly(request.dueAt)}
              </div>
              {effectiveStatus === 'OVERDUE' ? (
                <span>{getDaysOverdue(request.dueAt)} day(s) overdue</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function RequestGridSkeleton() {
  return (
    <div
      style={{
        minWidth: 0,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface)',
      }}
      className="animate-pulse"
    >
      <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '84px', height: '10px', borderRadius: '999px', backgroundColor: 'var(--bg-muted)' }} />
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ width: '65%', height: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)' }} />
        <div style={{ width: '55%', height: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)', marginTop: '10px' }} />
        <div style={{ width: '100%', height: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)', marginTop: '14px' }} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
        <div style={{ width: '100%', height: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)' }} />
      </div>
    </div>
  );
}

export function RequestDetailSkeleton() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ height: '52px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
      <div style={{ display: 'grid', gap: '20px' }} className="lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            style={{
              height: index === 2 ? '280px' : '160px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function RequestDetailLayout({
  request,
  viewerRole,
  faculty,
  fine,
  topAction,
  actionCard,
}: RequestDetailLayoutProps) {
  const effectiveStatus = getEffectiveStatus(request);
  const timeline = getTimeline(request);
  const totalTypes = request.items.length;
  const dueOverdue = effectiveStatus === 'OVERDUE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        <div>{topAction}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Request
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>
            #{request.id.slice(0, 8)}
          </div>
        </div>
        <StatusBadge status={effectiveStatus} size="md" />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '0 24px 24px' }}>
        <div style={{ display: 'grid', gap: '20px' }} className="lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DetailCard title="Student">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <Avatar name={request.studentName} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {request.studentName}
                  </div>
                  {request.studentRoll ? <InfoRow icon={GraduationCap} label="Roll Number" value={request.studentRoll} /> : null}
                  <InfoRow icon={Building2} label="Department" value={request.studentDept} />
                  <InfoRow icon={BookOpen} label="Semester" value="Not available" />
                  <InfoRow icon={Mail} label="Email" value={request.studentEmail ?? 'Not available'} accent />
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Purpose">
              <div
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {request.purpose}
              </div>
            </DetailCard>

            <DetailCard title="Request Timeline">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {timeline.map((milestone, index) => {
                  const Icon = milestone.icon;
                  const isDone = milestone.status === 'done';
                  const isActive = milestone.status === 'active';
                  const isSkipped = milestone.status === 'skipped';
                  const lineColor = isDone ? 'var(--accent)' : 'var(--border)';
                  const lineStyle = isDone ? 'solid' : 'dashed';
                  const bgColor = isDone
                    ? 'var(--accent-light)'
                    : isActive
                      ? dueOverdue && milestone.label === 'Due Date'
                        ? 'var(--danger-light)'
                        : 'var(--warning-light)'
                      : isSkipped
                        ? 'var(--danger-light)'
                        : 'var(--bg-muted)';
                  const iconColor = isDone
                    ? 'var(--accent)'
                    : isActive
                      ? dueOverdue && milestone.label === 'Due Date'
                        ? 'var(--danger)'
                        : 'var(--warning)'
                      : isSkipped
                        ? 'var(--danger)'
                        : 'var(--text-muted)';

                  return (
                    <div key={milestone.label} style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '999px',
                            backgroundColor: bgColor,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isActive ? `1px solid ${iconColor}` : '1px solid transparent',
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        {index < timeline.length - 1 ? (
                          <div
                            style={{
                              width: '2px',
                              flex: 1,
                              minHeight: '28px',
                              marginTop: '6px',
                              borderLeft: `2px ${lineStyle} ${lineColor}`,
                            }}
                          />
                        ) : null}
                      </div>
                      <div style={{ paddingTop: '4px', paddingBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{milestone.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {milestone.date ? formatDateTime(milestone.date.toISOString()) : '—'}
                        </div>
                        {milestone.note ? (
                          <div
                            style={{
                              fontSize: '12px',
                              marginTop: '4px',
                              color: milestone.note.includes('overdue') ? 'var(--danger)' : milestone.status === 'skipped' ? 'var(--danger)' : 'var(--text-secondary)',
                              fontStyle: milestone.note.includes('overdue') ? 'normal' : 'italic',
                            }}
                          >
                            {milestone.note}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DetailCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DetailCard title="Components Requested">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {request.items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 0',
                      borderBottom: index === request.items.length - 1 ? 'none' : '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>x {item.quantity}</div>
                      {item.condition ? (
                        <div
                          style={{
                            marginTop: '6px',
                            display: 'inline-flex',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              item.condition === 'Good'
                                ? 'var(--success-light)'
                                : item.condition === 'Damaged'
                                  ? 'var(--warning-light)'
                                  : 'var(--danger-light)',
                            color:
                              item.condition === 'Good'
                                ? 'var(--success)'
                                : item.condition === 'Damaged'
                                  ? 'var(--warning)'
                                  : 'var(--danger)',
                          }}
                        >
                          {item.condition}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '2px solid var(--border)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Total: {totalTypes} component type(s)
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Faculty">
              {faculty?.name ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Avatar name={faculty.name} size={36} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{faculty.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{faculty.department ?? 'Department unavailable'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      {faculty.employeeId ?? faculty.email ?? 'Faculty metadata unavailable'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <UserX size={20} />
                  {request.status === 'PENDING' ? 'No faculty assigned yet' : 'Faculty details are unavailable from the current data source'}
                </div>
              )}
            </DetailCard>

            <DetailCard title="Important Dates">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['Requested', formatDateTime(request.requestedAt), false],
                  ['Approved', formatDateTime(request.approvedAt), false],
                  ['Issued', formatDateTime(request.issuedAt), false],
                  ['Due Date', formatDateTime(request.dueAt), effectiveStatus === 'OVERDUE'],
                  ['Returned', formatDateTime(request.returnedAt), false],
                ].map(([label, value, danger]) => (
                  <div key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--text-primary)', textAlign: 'right' }}>
                      {value}
                    </span>
                  </div>
                ))}
                {effectiveStatus === 'OVERDUE' ? (
                  <div style={{ marginTop: '2px', fontSize: '11px', fontWeight: 700, color: 'var(--danger)' }}>
                    OVERDUE
                  </div>
                ) : null}

                {fine ? (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--danger)' }}>Fine Issued</div>
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>
                        ₹{(fine.amount / 100).toFixed(2)}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor:
                            fine.status === 'PENDING'
                              ? 'var(--danger-light)'
                              : fine.status === 'PAID'
                                ? 'var(--success-light)'
                                : 'var(--warning-light)',
                          color:
                            fine.status === 'PENDING'
                              ? 'var(--danger)'
                              : fine.status === 'PAID'
                                ? 'var(--success)'
                                : 'var(--warning)',
                        }}
                      >
                        {fine.status}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </DetailCard>

            {actionCard ? (
              <div>{actionCard}</div>
            ) : viewerRole === 'STUDENT' ? null : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BackButton() {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
      }}
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}
