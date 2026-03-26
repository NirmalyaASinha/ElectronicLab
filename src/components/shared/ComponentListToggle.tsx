'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ComponentListToggleProps {
  items: Array<{
    name: string
    category: string
    quantity: number
  }>
}

export default function ComponentListToggle({ items }: ComponentListToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Header / Collapsed State */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-muted)',
          transition: 'background-color 150ms ease',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronDown
            size={16}
            color="var(--text-secondary)"
            style={{
              transition: 'transform 200ms ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {items.length} Component{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && (
        <div
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.category}
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: '12px' }}>
                × {item.quantity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
