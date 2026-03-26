'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  CheckCircle,
  Package,
  Boxes,
  Users,
  BarChart3,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'STUDENT' | 'FACULTY' | 'ADMIN'
  userName: string
  userEmail?: string
  fineBalance?: number
  unreadNotifications?: number
  requestCount?: number
}

export default function DashboardLayout({
  children,
  userRole,
  userName,
  fineBalance,
  unreadNotifications = 0,
  requestCount = 0,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState('Dashboard')
  const [pageSubtitle, setPageSubtitle] = useState('')

  // Update page title based on pathname
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]

    const titleMap: Record<string, { title: string; subtitle: string }> = {
      // Student pages
      student: { title: 'Student Dashboard', subtitle: 'Browse and manage requests' },
      browse: { title: 'Browse Components', subtitle: 'Browse available electronics' },
      requests: { title: 'My Requests', subtitle: 'View and track your requests' },
      fines: { title: 'Fines & Penalties', subtitle: 'View your fine balance' },
      'request-proceed': { title: 'New Request', subtitle: 'Submit a new component request' },

      // Faculty pages
      faculty: { title: 'Faculty Dashboard', subtitle: 'Manage approvals and returns' },
      approvals: { title: 'Pending Approvals', subtitle: 'Review and approve requests' },
      issued: { title: 'Ready to Issue', subtitle: 'Mark components as issued' },
      returns: { title: 'Process Returns', subtitle: 'Track returned components' },

      // Admin pages
      admin: { title: 'Admin Dashboard', subtitle: 'System administration' },
      analytics: { title: 'Analytics', subtitle: 'View system analytics' },
      inventory: { title: 'Inventory Management', subtitle: 'Manage component inventory' },
      users: { title: 'User Management', subtitle: 'Manage users and roles' },
    }

    const titleInfo = titleMap[lastSegment] || { title: 'Dashboard', subtitle: '' }
    setPageTitle(titleInfo.title)
    setPageSubtitle(titleInfo.subtitle)
  }, [pathname])

  const getNavItems = () => {
    const baseIcon = { size: 18, strokeWidth: 2 }

    if (userRole === 'STUDENT') {
      return [
        {
          label: 'Dashboard',
          href: '/student',
          icon: <Home {...baseIcon} />,
          isActive: pathname === '/student',
        },
        {
          label: 'Browse Components',
          href: '/student/browse',
          icon: <ShoppingCart {...baseIcon} />,
          isActive: pathname.includes('/browse'),
        },
        {
          label: 'My Requests',
          href: '/student/requests',
          icon: <FileText {...baseIcon} />,
          isActive: pathname.includes('/requests'),
        },
        {
          label: 'Fines & Penalties',
          href: '/student/fines',
          icon: <AlertCircle {...baseIcon} />,
          isActive: pathname.includes('/fines'),
        },
      ]
    } else if (userRole === 'FACULTY') {
      return [
        {
          label: 'Dashboard',
          href: '/faculty',
          icon: <Home {...baseIcon} />,
          isActive: pathname === '/faculty',
        },
        {
          label: 'Pending Approvals',
          href: '/faculty/approvals',
          icon: <CheckCircle {...baseIcon} />,
          isActive: pathname.includes('/approvals'),
        },
        {
          label: 'Ready to Issue',
          href: '/faculty/issued',
          icon: <Package {...baseIcon} />,
          isActive: pathname.includes('/issued'),
        },
        {
          label: 'Process Returns',
          href: '/faculty/returns',
          icon: <Package {...baseIcon} />,
          isActive: pathname.includes('/returns'),
        },
        {
          label: 'Components',
          href: '/faculty/components',
          icon: <Boxes {...baseIcon} />,
          isActive: pathname.includes('/components'),
        },
      ]
    } else {
      // Admin
      return [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: <Home {...baseIcon} />,
          isActive: pathname === '/admin',
        },
        {
          label: 'Analytics',
          href: '/admin/analytics',
          icon: <BarChart3 {...baseIcon} />,
          isActive: pathname.includes('/analytics'),
        },
        {
          label: 'Inventory',
          href: '/admin/inventory',
          icon: <Package {...baseIcon} />,
          isActive: pathname.includes('/inventory'),
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: <Users {...baseIcon} />,
          isActive: pathname.includes('/users'),
        },
      ]
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar
        navItems={getNavItems()}
        userRole={userRole}
        userName={userName}
        fineBalance={fineBalance}
      />

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: '0',
          marginTop: '0',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
        className="lg:ml-60"
      >
        {/* Header */}
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          unreadNotifications={unreadNotifications}
          requestCount={requestCount}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: '24px 20px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-base)',
          }}
          className="sm:p-6 lg:p-6"
        >
          <div
            style={{
              maxWidth: '1200px',
              marginLeft: 'auto',
              marginRight: 'auto',
              animation: 'pageEnter 0.2s ease forwards',
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Responsive sidebar styles */}
      <style>{`
        @media (max-width: 1023px) {
          main {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
