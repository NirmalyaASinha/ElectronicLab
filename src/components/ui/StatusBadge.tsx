'use client'

interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' |
          'RETURNED' | 'OVERDUE' | 'CANCELLED' | 'AVAILABLE' |
          'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED'
  size?: 'sm' | 'md'
}

const config: Record<string, { label: string; bg: string; color: string; dot: boolean; pulse: boolean }> = {
  PENDING:       { label: 'Pending',       bg: 'var(--info-light)',    color: 'var(--info)',    dot: true,  pulse: false },
  APPROVED:      { label: 'Approved',      bg: 'var(--success-light)', color: 'var(--success)', dot: true,  pulse: false },
  REJECTED:      { label: 'Rejected',      bg: 'var(--danger-light)',  color: 'var(--danger)',  dot: false, pulse: false },
  ISSUED:        { label: 'Issued',        bg: 'var(--accent-light)',  color: 'var(--accent)',  dot: true,  pulse: false },
  RETURNED:      { label: 'Returned',      bg: 'var(--neutral-light)', color: 'var(--neutral)', dot: false, pulse: false },
  OVERDUE:       { label: 'Overdue',       bg: 'var(--danger-light)',  color: 'var(--danger)',  dot: true,  pulse: true  },
  CANCELLED:     { label: 'Cancelled',     bg: 'var(--neutral-light)', color: 'var(--neutral)', dot: false, pulse: false },
  AVAILABLE:     { label: 'Available',     bg: 'var(--success-light)', color: 'var(--success)', dot: true,  pulse: false },
  LOW_STOCK:     { label: 'Low Stock',     bg: 'var(--warning-light)', color: 'var(--warning)', dot: true,  pulse: false },
  OUT_OF_STOCK:  { label: 'Out of Stock',  bg: 'var(--danger-light)',  color: 'var(--danger)',  dot: false, pulse: false },
  DISCONTINUED:  { label: 'Discontinued',  bg: 'var(--neutral-light)', color: 'var(--neutral)', dot: false, pulse: false },
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = config[status] || config.PENDING
  const paddingClass = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'
  const dotSize = size === 'sm' ? '4px' : '6px'

  return (
    <div
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '20px',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        ...(cfg.pulse && { animation: 'pulse 1.5s ease-in-out infinite' }),
      }}
    >
      {cfg.dot && (
        <div
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: cfg.color,
            borderRadius: '50%',
          }}
        />
      )}
      {cfg.label}
    </div>
  )
}
