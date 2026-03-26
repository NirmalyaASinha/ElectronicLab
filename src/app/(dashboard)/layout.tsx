'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const role = (session.user as { id?: string; role?: string; department?: string })?.role || 'STUDENT';

  const navItems = {
    STUDENT: [
      { label: 'Browse', href: '/student/browse', icon: '📦' },
      { label: 'My Requests', href: '/student/requests', icon: '📋' },
      { label: 'My Fines', href: '/student/fines', icon: '⚠️' },
      { label: 'Profile', href: '/profile', icon: '👤' },
    ],
    FACULTY: [
      { label: 'Approvals', href: '/faculty/approvals', icon: '✅' },
      { label: 'Issued', href: '/faculty/issued', icon: '📤' },
      { label: 'Returns', href: '/faculty/returns', icon: '📥' },
      { label: 'Profile', href: '/profile', icon: '👤' },
    ],
    ADMIN: [
      { label: 'Inventory', href: '/admin/inventory', icon: '🏭' },
      { label: 'Users', href: '/admin/users', icon: '👥' },
      { label: 'Analytics', href: '/admin/analytics', icon: '📊' },
      { label: 'Profile', href: '/profile', icon: '👤' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '240px' : '60px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
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
              padding: '0.5rem',
              borderRadius: 'var(--radius)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            {sidebarOpen && (
              <Image
                src="/RRU.png"
                alt="RRU Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
              />
            )}
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
            {sidebarOpen && (
              <Image
                src="/SASET.png"
                alt="SASET Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
              />
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
            }}
          >
            ☰
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
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
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Fine Balance Indicator */}
        {((session.user as { id?: string; role?: string; department?: string })?.role ||'STUDENT') === 'STUDENT' && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              borderLeft: '3px solid var(--warning)',
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
            padding: '1rem',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)',
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
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
              width: '100%',
              padding: '0.5rem',
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
          marginLeft: sidebarOpen ? '240px' : '60px',
          transition: 'margin-left 0.3s ease',
          padding: '2rem',
          overflow: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
