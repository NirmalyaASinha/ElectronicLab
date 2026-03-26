'use client';

import RequestCard from './RequestCard';

interface RequestDetailItem {
  id: string;
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  returnedQty?: number;
}

export interface RequestDetail {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  studentEmail?: string;
  status: string;
  purpose: string;
  requestedAt?: string;
  approvedAt?: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  rejectionReason?: string;
  items: RequestDetailItem[];
}

interface RequestDetailCardProps {
  request: RequestDetail;
  actionMode?: 'approve' | 'issue' | null;
  onApprove?: (id: string) => void | Promise<void>;
  onReject?: (id: string, reason: string) => void | Promise<void>;
  onIssue?: (id: string) => void | Promise<void>;
}

const toDate = (value?: string): Date | undefined => {
  return value ? new Date(value) : undefined;
};

export default function RequestDetailCard({
  request,
  actionMode = null,
  onApprove,
  onReject,
  onIssue,
}: RequestDetailCardProps) {
  return (
    <RequestCard
      request={{
        id: request.id,
        status: request.status,
        purpose: request.purpose,
        requestedAt: toDate(request.requestedAt) ?? new Date(),
        approvedAt: toDate(request.approvedAt),
        issuedAt: toDate(request.issuedAt),
        dueAt: toDate(request.dueAt),
        returnedAt: toDate(request.returnedAt),
        rejectionReason: request.rejectionReason,
      }}
      student={{
        name: request.studentName,
        email: request.studentEmail ?? 'Not available',
        rollNumber: request.studentRoll,
        department: request.studentDept,
      }}
      items={request.items.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
      }))}
      showActions={actionMode}
      onApprove={onApprove}
      onReject={onReject}
      onIssue={onIssue}
    />
  );
}
