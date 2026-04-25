import { db } from '@/db';
import { notifications } from '@/db/schema';

type NotificationType =
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'COMPONENTS_ISSUED'
  | 'DUE_REMINDER'
  | 'OVERDUE_ALERT'
  | 'FINE_ISSUED'
  | 'FINE_WAIVED'
  | 'RETURN_CONFIRMED'
  | 'CONCERN_CREATED'
  | 'CONCERN_REPLIED'
  | 'CONCERN_STATUS_UPDATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_JOINED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_UPDATED';

type NotificationPayload = {
  userId: string | null | undefined;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function createNotifications(payloads: NotificationPayload[]) {
  const filtered = payloads
    .filter((payload) => payload.userId)
    .map((payload) => ({
      userId: String(payload.userId),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ?? null,
      isRead: false,
    }));

  if (!filtered.length) return;
  await db.insert(notifications).values(filtered);
}

export function projectHrefForRole(role: string, projectId: string) {
  return role === 'ADMIN' ? `/admin/projects/${projectId}` : `/student/projects/${projectId}`;
}

export function concernsHrefForRole(role: string) {
  if (role === 'ADMIN') return '/admin/concerns';
  if (role === 'FACULTY') return '/faculty/concerns';
  return '/student/concerns';
}
