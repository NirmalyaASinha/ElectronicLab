'use client'

import { useState } from 'react'
import { PackageCheck, RotateCcw, Check, X } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import SectionLabel from '../ui/SectionLabel'
import Avatar from '../ui/Avatar'
import Timeline from './Timeline'
import ComponentListToggle from './ComponentListToggle'

interface RequestCardProps {
  request: {
    id: string
    status: string
    purpose: string
    requestedAt: Date
    approvedAt?: Date
    issuedAt?: Date
    dueAt?: Date
    returnedAt?: Date
    rejectionReason?: string
  }
  student: {
    name: string
    email: string
    rollNumber?: string
    department: string
    semester?: number
  }
  faculty?: {
    name: string
    department: string
  }
  items: Array<{
    name: string
    category: string
    quantity: number
  }>
  showActions?: 'approve' | 'issue' | 'return' | null
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  onIssue?: (id: string) => void
  onReturn?: (id: string) => void
}

const getRequestStatus = (status: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED' => {
  if (status.toUpperCase() === 'PENDING') return 'PENDING'
  if (status.toUpperCase() === 'APPROVED') return 'APPROVED'
  if (status.toUpperCase() === 'REJECTED') return 'REJECTED'
  if (status.toUpperCase() === 'ISSUED') return 'ISSUED'
  if (status.toUpperCase() === 'RETURNED') return 'RETURNED'
  if (status.toUpperCase() === 'CANCELLED') return 'CANCELLED'
  return 'PENDING'
}

const isOverdue = (dueAt?: Date): boolean => {
  if (!dueAt) return false
  return new Date() > dueAt
}

export default function RequestCard({
  request,
  student,
  faculty,
  items,
  showActions = null,
  onApprove,
  onReject,
  onIssue,
  onReturn,
}: RequestCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const timelineItems = [
    {
      label: 'Request Submitted',
      date: request.requestedAt,
      status: 'completed' as const,
    },
    {
      label: 'Request Approved',
      date: request.approvedAt || null,
      status: request.approvedAt ? ('completed' as const) : ('pending' as const),
      note: request.rejectionReason ? `Rejected: ${request.rejectionReason}` : undefined,
    },
    {
      label: 'Items Issued',
      date: request.issuedAt || null,
      status: request.issuedAt ? ('completed' as const) : ('pending' as const),
    },
    {
      label: 'Items Due/Returned',
      date: request.returnedAt || request.dueAt || null,
      status: request.returnedAt ? ('completed' as const) : isOverdue(request.dueAt) ? ('active' as const) : ('pending' as const),
    },
  ]

  const shortId = request.id.substring(0, 8)
  const overdue = isOverdue(request.dueAt) && request.status !== 'RETURNED'

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return
    setIsProcessing(true)
    try {
      await onReject?.(request.id, rejectReason)
    } finally {
      setIsProcessing(false)
      setShowRejectForm(false)
      setRejectReason('')
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove?.(request.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleIssue = async () => {
    setIsProcessing(true)
    try {
      await onIssue?.(request.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturn = async () => {
    setIsProcessing(true)
    try {
      await onReturn?.(request.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        marginBottom: '16px',
        transition: 'box-shadow 200ms ease',
        ...(overdue && {
          borderLeft: '3px solid var(--danger)',
        }),
        ...(!overdue && request.status === 'APPROVED' && !request.issuedAt && {
          borderLeft: '3px solid var(--success)',
        }),
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Request
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            #{shortId}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusBadge status={getRequestStatus(request.status)} />
          {overdue && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)' }}>
              Overdue
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div
        style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '24px',
        }}
      >
        {/* Left Panel */}
        <div>
          {/* Student Section */}
          <div>
            <SectionLabel>Student</SectionLabel>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Avatar name={student.name} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {student.name}
                </div>
                {student.rollNumber && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Roll: {student.rollNumber}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {student.department}
                </div>
                {student.semester && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Sem: {student.semester}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purpose Section */}
          <div style={{ marginTop: '16px' }}>
            <SectionLabel>Purpose</SectionLabel>
            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '13px',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
              }}
            >
              {request.purpose}
            </div>
          </div>

          {/* Timeline Section */}
          <div style={{ marginTop: '16px' }}>
            <SectionLabel>Timeline</SectionLabel>
            <Timeline items={timelineItems} />
          </div>
        </div>

        {/* Right Panel (Components and Faculty) - only show on desktop via CSS media */}
        <div style={{ display: 'none' }}>
          {/* Components Section */}
          <div>
            <SectionLabel>Components</SectionLabel>
            <ComponentListToggle items={items} />
          </div>

          {/* Faculty Section */}
          {faculty && (
            <div style={{ marginTop: '16px' }}>
              <SectionLabel>Faculty</SectionLabel>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {faculty.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {faculty.department}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Components Section - shown inline on all screens */}
      <div style={{ padding: '0 20px' }}>
        <SectionLabel>Components</SectionLabel>
        <ComponentListToggle items={items} />
      </div>

      {/* Faculty Section - shown inline on all screens */}
      {faculty && (
        <div style={{ padding: '0 20px', marginTop: '16px' }}>
          <SectionLabel>Faculty</SectionLabel>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {faculty.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {faculty.department}
            </div>
          </div>
        </div>
      )}
      {!faculty && (
        <div style={{ padding: '0 20px', marginTop: '16px' }}>
          <SectionLabel>Faculty</SectionLabel>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Pending assignment
          </div>
        </div>
      )}

      {/* Action Bar */}
      {showActions !== null && (
        <>
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            {showActions === 'approve' && (
              <>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--danger)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--danger)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!isProcessing) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-light)'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)'
                  }}
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!isProcessing) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dark)'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'
                  }}
                >
                  <Check size={16} />
                  Approve
                </button>
              </>
            )}

            {showActions === 'issue' && (
              <button
                onClick={handleIssue}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  if (!isProcessing) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dark)'
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'
                }}
              >
                <PackageCheck size={16} />
                Mark as Issued
              </button>
            )}

            {showActions === 'return' && (
              <button
                onClick={handleReturn}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  if (!isProcessing) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#16873d'
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--success)'
                }}
              >
                <RotateCcw size={16} />
                Process Return
              </button>
            )}
          </div>

          {/* Reject Form */}
          {showRejectForm && showActions === 'approve' && (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'pageEnter 0.2s ease forwards',
              }}
            >
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  minHeight: '80px',
                  resize: 'none',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--accent-light)'
                }}
                onBlur={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectReason('')
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={isProcessing || !rejectReason.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: isProcessing || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: isProcessing || !rejectReason.trim() ? 0.5 : 1,
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
