'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Bell, Moon, Sun, FolderKanban, Warehouse, UserCog, ChartNoAxesColumn, BookUser, KeyRound, ContactRound, CircleCheckBig, PackageOpen, PackageCheck, ScanSearch, ListChecks, ReceiptIndianRupee, MessageSquareWarning } from 'lucide-react';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    href?: string;
    requestId?: string;
    concernId?: string;
    projectId?: string;
  } | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setNotificationItems(data.data);
        }
      } catch {
        setNotificationItems([]);
      }
    };

    if (status === 'authenticated') {
      void loadNotifications();
    }
  }, [status]);

  if (status === 'loading') {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const role = (session.user as { id?: string; role?: string; department?: string })?.role || 'STUDENT';

  const navItems = {
    STUDENT: [
      { label: 'Browse', href: '/student/browse', icon: <ScanSearch /> },
      { label: 'My Projects', href: '/student/projects', icon: <FolderKanban /> },
      { label: 'My Requests', href: '/student/requests', icon: <ListChecks /> },
      { label: 'Concerns', href: '/student/concerns', icon: <MessageSquareWarning /> },
      { label: 'Lab Access', href: '/student/lab-access', icon: <KeyRound /> },
      { label: 'Lab Entries', href: '/student/lab-entries', icon: <ListChecks /> },
      { label: 'My Fines', href: '/student/fines', icon: <ReceiptIndianRupee /> },
      { label: 'Profile', href: '/profile', icon: <ContactRound /> },
    ],
    FACULTY: [
      { label: 'Student Projects', href: '/student/projects', icon: <FolderKanban /> },
      { label: 'Approvals', href: '/faculty/approvals', icon: <CircleCheckBig /> },
      { label: 'Concerns', href: '/faculty/concerns', icon: <MessageSquareWarning /> },
      { label: 'Issued', href: '/faculty/issued', icon: <PackageOpen /> },
      { label: 'Returns', href: '/faculty/returns', icon: <PackageCheck /> },
      { label: 'Inventory', href: '/faculty/components', icon: <Warehouse /> },
      { label: 'Students', href: '/faculty/students', icon: <BookUser /> },
      { label: 'Lab Access', href: '/faculty/lab-access', icon: <KeyRound /> },
      { label: 'Lab Entries', href: '/faculty/lab-entries', icon: <ListChecks /> },
      { label: 'Profile', href: '/profile', icon: <ContactRound /> },
    ],
    ADMIN: [
      { label: 'Projects', href: '/admin/projects', icon: <FolderKanban /> },
      { label: 'Inventory', href: '/admin/inventory', icon: <Warehouse /> },
      { label: 'Concerns', href: '/admin/concerns', icon: <MessageSquareWarning /> },
      { label: 'Users', href: '/admin/users', icon: <UserCog /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <ChartNoAxesColumn /> },
      { label: 'Students', href: '/admin/students', icon: <BookUser /> },
      { label: 'Lab Access', href: '/admin/labs', icon: <KeyRound /> },
      { label: 'Lab Entries', href: '/admin/lab-entries', icon: <ListChecks /> },
      { label: 'Profile', href: '/profile', icon: <ContactRound /> },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || [];
  const unreadCount = useMemo(() => {
    if (!Array.isArray(notificationItems)) return 0;
    return notificationItems.filter((notification) => !notification.isRead).length;
  }, [notificationItems]);

  const getNotificationHref = (notification: NotificationItem) => {
    if (notification.metadata?.href) return notification.metadata.href;
    if (notification.metadata?.requestId) return `/requests/${notification.metadata.requestId}`;
    if (notification.metadata?.concernId) return '/student/concerns';
    if (notification.metadata?.projectId) return `/student/projects/${notification.metadata.projectId}`;
    return '/notifications';
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotificationItems((items) => items.map((notification) => (
        notification.id === id ? { ...notification, isRead: true } : notification
      )));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotificationItems((items) => items.map((notification) => ({ ...notification, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Top Header with Logos */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          zIndex: 101,
          position: 'relative',
        }}
      >
        <a href="https://rru.ac.in/school/saset" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
          <Image
            src="/RRU.png"
            alt="RRU Logo"
            width={80}
            height={80}
            style={{ objectFit: 'contain', cursor: 'pointer' }}
          />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setNotificationOpen((value) => !value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                position: 'relative',
              }}
            >
              <Bell size={16} />
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '340px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Notification Center</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recent alerts and updates</p>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {!Array.isArray(notificationItems) || notificationItems.length === 0 ? (
                    <div style={{ padding: '18px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notificationItems.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          void markNotificationRead(notification.id);
                          setNotificationOpen(false);
                          router.push(getNotificationHref(notification));
                        }}
                        style={{
                          padding: '14px 16px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: notification.isRead ? 'var(--bg-surface)' : 'var(--accent-light)',
                          cursor: 'pointer',
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{notification.title}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{notification.message}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => void markAllNotificationsRead()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Mark All Read
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/notifications')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Open Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <a href="https://rru.ac.in/" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, marginLeft: 'auto' }}>
          <Image
            src="/SASET.png"
            alt="SASET Logo"
            width={80}
            height={80}
            style={{ objectFit: 'contain', cursor: 'pointer' }}
          />
        </a>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: sidebarOpen ? '240px' : '84px',
            minWidth: sidebarOpen ? '240px' : '84px',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            padding: sidebarOpen ? '1.5rem 1rem' : '1.5rem 0.75rem',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            alignSelf: 'flex-start',
            zIndex: 100,
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            marginBottom: '2rem',
            gap: sidebarOpen ? '0.75rem' : '0',
          }}
        >
          <button
            onClick={() => {
              const dashboardPath = role === 'STUDENT' ? '/student' : role === 'FACULTY' ? '/faculty' : '/admin';
              router.push(dashboardPath);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sidebarOpen ? '0.5rem' : '0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: sidebarOpen ? '0.5rem' : '0',
              borderRadius: 'var(--radius)',
              transition: 'all 0.2s ease',
              flex: sidebarOpen ? 1 : '0 0 auto',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            {sidebarOpen && (
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                }}
              >
                E-Lab
              </h2>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        </div>

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  gap: sidebarOpen ? '0.75rem' : '0',
                  padding: sidebarOpen ? '0.75rem' : '0.85rem 0.5rem',
                  marginBottom: '0.5rem',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  minHeight: '52px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    width: '24px',
                    minWidth: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Fine Balance Indicator */}
        {((session.user as { id?: string; role?: string; department?: string })?.role ||'STUDENT') === 'STUDENT' && (
          <div
            style={{
              padding: sidebarOpen ? '1rem' : '0.5rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              borderLeft: sidebarOpen ? '3px solid var(--warning)' : 'none',
              marginTop: 'auto',
              display: sidebarOpen ? 'block' : 'none',
            }}
          >
            {sidebarOpen && (
              <>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Your Fine Balance
                </p>
                <p
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--warning)',
                  }}
                >
                  ₹0.00
                </p>
              </>
            )}
          </div>
        )}

        {/* User Card */}
        <div
          style={{
            padding: sidebarOpen ? '1rem' : '0.5rem',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)',
            borderTop: '1px solid var(--border)',
            paddingTop: sidebarOpen ? '1rem' : '0.5rem',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: sidebarOpen ? 'stretch' : 'center',
          }}
        >
          {sidebarOpen && (
            <>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {session.user.name}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                }}
              >
                {role}
              </p>
            </>
          )}
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            style={{
              width: sidebarOpen ? '100%' : '44px',
              height: sidebarOpen ? 'auto' : '44px',
              padding: sidebarOpen ? '0.5rem' : '0',
              backgroundColor: 'var(--danger)',
              color: 'white',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {sidebarOpen ? 'Logout' : '→'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: 0,
          transition: 'none',
          padding: '2rem',
          overflow: 'auto',
        }}
      >
        {role === 'STUDENT' && <DashboardTopBar />}
        {children}
      </main>
      </div>
    </div>
  );
}
