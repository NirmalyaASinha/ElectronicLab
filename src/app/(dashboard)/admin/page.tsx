'use client';

import { useRouter } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import InformationBoard from '@/components/InformationBoard';

export const dynamic = 'force-dynamic';

const adminActions = [
  {
    title: 'Inventory Control',
    description: 'Add components, review stock levels, and keep lab inventory healthy.',
    icon: '📦',
    href: '/admin/inventory',
  },
  {
    title: 'User Management',
    description: 'Create accounts, assign roles, and manage access across the platform.',
    icon: '👥',
    href: '/admin/users',
  },
  {
    title: 'Admin Concerns',
    description: 'Review concerns targeted specifically to admin and respond quickly.',
    icon: '🛎️',
    href: '/admin/concerns',
  },
  {
    title: 'Analytics',
    description: 'Track usage trends, component demand, and overall system activity.',
    icon: '📊',
    href: '/admin/analytics',
  },
  {
    title: 'Students',
    description: 'View student records, monitor activity, and support account needs.',
    icon: '🎓',
    href: '/admin/students',
  },
  {
    title: 'Lab Oversight',
    description: 'Manage lab access, operational availability, and policy-level control.',
    icon: '🧪',
    href: '/admin/labs',
  },
];

export default function AdminHome() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Welcome, Admin! 👋
          </h1>
          <p className="text-[var(--text-secondary)]">
            Oversee operations, manage access, and keep the electronics lab system running smoothly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <LiveClock />
            <InformationBoard allowEdit />
            <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Admin Focus
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-6">
                    Prioritize user management, inventory oversight, admin-targeted concerns, and analytics visibility from one place.
                  </p>
                </div>
                <div className="text-3xl">🛠️</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Control
                  </div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    Users & roles
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Monitor
                  </div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    Labs & inventory
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <MiniCalendar />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Quick Access
          </h2>
          <StaggerContainer staggerDelay={0.08}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {adminActions.map((action) => (
                <StaggerItem key={action.href}>
                  <div
                    onClick={() => router.push(action.href)}
                    className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)] font-display mb-2 text-lg">
                          {action.title}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-6">
                          {action.description}
                        </p>
                      </div>
                      <div className="text-2xl group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                    </div>
                    <div className="mt-5 text-xs text-[var(--accent)] font-medium">
                      Open →
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
}
