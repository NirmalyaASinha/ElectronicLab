'use client'

import { useState } from 'react'
import { LogOut, X } from 'lucide-react'
import Avatar from '../ui/Avatar'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

interface SidebarProps {
  navItems: NavItem[]
  userRole: 'STUDENT' | 'FACULTY' | 'ADMIN'
  userName: string
  fineBalance?: number
}

export default function Sidebar({ navItems, userRole, userName, fineBalance }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    // Call logout
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <>
      {/* Close button for mobile */}
      <div
        className="lg:hidden absolute top-4 right-4"
        onClick={() => setIsMobileOpen(false)}
        style={{ cursor: 'pointer' }}
      >
        <X size={24} color="var(--text-primary)" />
      </div>

      {/* Logo Section */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          ElectraLab
        </div>
      </div>

      {/* Nav Section */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: item.isActive ? 600 : 500,
              color: item.isActive ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              backgroundColor: item.isActive ? 'var(--accent-light)' : 'transparent',
              borderLeft: item.isActive ? '3px solid var(--accent)' : 'none',
              paddingLeft: item.isActive ? '9px' : '12px',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              if (!item.isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-light)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
              }
            }}
            onMouseLeave={e => {
              if (!item.isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}>
        {/* Fine Balance Card */}
        {userRole === 'STUDENT' && fineBalance !== undefined && fineBalance > 0 && (
          <div
            style={{
              backgroundColor: 'var(--warning-light)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>
              Fine Balance
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--warning)', marginTop: '2px' }}>
              ₹{fineBalance}
            </div>
          </div>
        )}

        {/* User Info Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 8px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar name={userName} size={32} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {userName.split(' ')[0]}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {userRole.toLowerCase()}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--danger)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Hamburger Button - shown in Header */}
      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '240px',
          height: '100vh',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 40,
              display: 'block',
            }}
            className="lg:hidden"
          />
          {/* Sidebar Panel */}
          <div
            className="lg:hidden"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: 'var(--bg-surface)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              animation: 'pageEnter 0.25s ease forwards',
            }}
          >
            <SidebarContent />
          </div>
        </>
      )}

      {/* Global style for mobile hamburger toggle */}
      <style>{`
        .sidebar-hamburger {
          display: none;
        }
        @media (max-width: 1023px) {
          .sidebar-hamburger {
            display: flex;
          }
        }
      `}</style>

      {/* Hamburger button context for Header */}
      <script suppressHydrationWarning>{`
        window.toggleMobileSidebar = function() {
          const event = new CustomEvent('toggle-sidebar');
          window.dispatchEvent(event);
        }
      `}</script>
    </>
  )
}

// Export a context/hook helper for header to trigger sidebar
export const useSidebarToggle = () => {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    toggle: () => setIsOpen(!isOpen),
    close: () => setIsOpen(false),
  }
}
