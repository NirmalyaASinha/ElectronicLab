'use client'

import { useState, useEffect } from 'react'
import { Menu, Search, Bell, ClipboardList } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  unreadNotifications?: number
  requestCount?: number
  onMenuClick?: () => void
}

export default function Header({
  title,
  subtitle,
  unreadNotifications = 0,
  requestCount = 0,
  onMenuClick,
}: HeaderProps) {
  const [animateShake, setAnimateShake] = useState(false)

  useEffect(() => {
    if (unreadNotifications > 0) {
      setAnimateShake(true)
      const timer = setTimeout(() => setAnimateShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [unreadNotifications])

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Hamburger + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0',
                fontFamily: 'var(--font-body)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Icons Group */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Search Button */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
        >
          <Search size={18} />
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease',
              ...(animateShake && { animation: 'shake 0.5s ease' }),
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            }}
          >
            <Bell size={18} />
          </button>
          {unreadNotifications > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </div>
          )}
        </div>

        {/* Request/Clipboard List Icon - only for students */}
        {requestCount !== undefined && requestCount > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
              }}
            >
              <ClipboardList size={18} />
            </button>
            {requestCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '0 4px',
                }}
              >
                {requestCount > 9 ? '9+' : requestCount}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
