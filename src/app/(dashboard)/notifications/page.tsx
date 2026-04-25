'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    href?: string;
    requestId?: string;
    concernId?: string;
    projectId?: string;
  } | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

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

  useEffect(() => {
    void loadNotifications();
  }, []);

  const getNotificationHref = (notification: NotificationItem) => {
    if (notification.metadata?.href) return notification.metadata.href;
    if (notification.metadata?.requestId) return `/requests/${notification.metadata.requestId}`;
    if (notification.metadata?.concernId) return `/student/concerns`;
    if (notification.metadata?.projectId) return `/student/projects/${notification.metadata.projectId}`;
    return null;
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));
  };

  const handleOpen = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    const href = getNotificationHref(notification);
    if (href) router.push(href);
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Notification Center</h1>
          <p className="text-[var(--text-secondary)]">A central place for your latest alerts and activity.</p>
        </div>
        <button
          type="button"
          onClick={() => void markAllAsRead()}
          disabled={markingAll || notifications.every((notification) => notification.isRead)}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
        >
          {markingAll ? 'Marking...' : 'Mark All Read'}
        </button>
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
              onClick={() => void handleOpen(notification)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">{notification.title}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.message}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${notification.isRead ? 'text-[var(--text-secondary)] bg-[var(--bg-elevated)]' : 'text-[var(--accent)] bg-[var(--accent-light)]'}`}>
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
