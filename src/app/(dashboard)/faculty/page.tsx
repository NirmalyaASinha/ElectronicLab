'use client';

import { useRouter } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';

export const dynamic = 'force-dynamic';

export default function FacultyHome() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Welcome, Faculty! 👋
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage student approvals, track issued components, and process returns
          </p>
        </div>

        {/* Top Section: Clock and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LiveClock />
          </div>
          <div className="lg:col-span-2">
            <MiniCalendar />
          </div>
        </div>

        {/* Quick Access Cards */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Quick Access
          </h2>
          <StaggerContainer staggerDelay={0.1}>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <StaggerItem>
                <div
                  onClick={() => router.push('/faculty/approvals')}
                  className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] font-display mb-1 text-lg">
                        ✅ Pending Approvals
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Review and approve student requests
                      </p>
                    </div>
                    <div className="text-2xl group-hover:scale-110 transition-transform">✅</div>
                  </div>
                  <div className="mt-4 text-xs text-[var(--accent)] font-medium">
                    View All →
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div
                  onClick={() => router.push('/faculty/issued')}
                  className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] font-display mb-1 text-lg">
                        📤 Issued Components
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Track issued items and due dates
                      </p>
                    </div>
                    <div className="text-2xl group-hover:scale-110 transition-transform">📤</div>
                  </div>
                  <div className="mt-4 text-xs text-[var(--accent)] font-medium">
                    View All →
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div
                  onClick={() => router.push('/faculty/returns')}
                  className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] font-display mb-1 text-lg">
                        📥 Process Returns
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Record component returns and conditions
                      </p>
                    </div>
                    <div className="text-2xl group-hover:scale-110 transition-transform">📥</div>
                  </div>
                  <div className="mt-4 text-xs text-[var(--accent)] font-medium">
                    View All →
                  </div>
                </div>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
}
