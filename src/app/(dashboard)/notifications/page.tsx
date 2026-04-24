'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Notification Center</h1>
        <p className="text-[var(--text-secondary)]">A central place for your latest alerts and activity.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">{notification.title}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.message}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-elevated)]">
                  {notification.isRead ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}