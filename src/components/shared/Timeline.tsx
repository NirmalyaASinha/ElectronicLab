'use client'

interface TimelineItem {
  label: string
  date: Date | null
  status: 'completed' | 'active' | 'pending'
  note?: string
}

interface TimelineProps {
  items: TimelineItem[]
}

const formatDate = (date: Date | null): string => {
  if (!date) return '—'
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }
  return new Intl.DateTimeFormat('en-IN', options).format(date)
}

const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {items.map((item, idx) => {
        const isCompleted = item.status === 'completed'
        const isActive = item.status === 'active'
        const dotColor = isCompleted ? 'var(--accent)' : isActive ? 'var(--warning)' : 'transparent'
        const borderColor = isCompleted ? 'var(--accent)' : 'var(--border)'
        const lineStyle = isCompleted || isActive ? 'solid' : 'dashed'
        const timeDisplay = isActive ? getRelativeTime(item.date!) : formatDate(item.date)

        return (
          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Vertical line container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2px' }}>
              {/* Dot */}
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  border: isCompleted || isActive ? 'none' : `2px solid ${borderColor}`,
                  zIndex: 1,
                }}
              />
              {/* Line (only if not last item) */}
              {idx < items.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    height: '32px',
                    borderStyle: lineStyle,
                    borderLeft: `2px ${lineStyle} ${borderColor}`,
                    marginTop: '4px',
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {timeDisplay}
              </div>
              {item.note && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--danger)', marginTop: '4px' }}>
                  {item.note}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
