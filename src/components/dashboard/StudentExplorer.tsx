'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserRound, FileText, Package, Clock3, IndianRupee } from 'lucide-react';

type StudentRequest = {
  id: string;
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  returnedAt?: string | null;
  rejectionReason?: string | null;
  facultyName?: string | null;
  items: Array<{
    id: string;
    componentId: string;
    componentName: string;
    category: string;
    quantity: number;
    returnedQty: number;
  }>;
  fines: Array<{
    requestId: string;
    amount: number;
    status: string;
    reason: string;
  }>;
};

type StudentRecord = {
  id: string;
  name: string;
  email: string;
  department: string;
  rollNumber?: string | null;
  semester?: number | null;
  requestCount: number;
  activeRequestCount: number;
  requests: StudentRequest[];
};

type ApiResponse = {
  success: boolean;
  data?: StudentRecord[];
};

export function StudentExplorer() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/students/overview', { cache: 'no-store' });
        const data = (await response.json()) as ApiResponse;

        if (!data.success || !data.data) {
          throw new Error('Failed to load students');
        }

        setStudents(data.data);
        setSelectedStudentId(data.data[0]?.id ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    void loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [student.name, student.email, student.department, student.rollNumber ?? '', String(student.semester ?? '')]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [search, students]);

  const selectedStudent = filteredStudents.find((student) => student.id === selectedStudentId) ?? filteredStudents[0] ?? null;

  useEffect(() => {
    if (selectedStudentId && !filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0]?.id ?? null);
    }
  }, [filteredStudents, selectedStudentId]);

  if (loading) {
    return <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-secondary)]">Loading students...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-light)] p-4 text-[var(--danger)]">{error}</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
        <div className="mb-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Students</h2>
            <p className="text-sm text-[var(--text-secondary)]">Alphabetical history explorer</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--text-secondary)]" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, roll no, department"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
          {filteredStudents.map((student) => {
            const active = selectedStudentId === student.id;

            return (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{student.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{student.rollNumber ?? 'Roll unavailable'}</p>
                  </div>
                  <UserRound size={16} className="text-[var(--accent)]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-secondary)]">
                  <span className="rounded-full bg-[var(--bg-surface)] px-2 py-1">{student.department}</span>
                  <span className="rounded-full bg-[var(--bg-surface)] px-2 py-1">{student.requestCount} requests</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
        {selectedStudent ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedStudent.name}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{selectedStudent.email}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {selectedStudent.department} · {selectedStudent.rollNumber ?? 'No roll number'}
                  {selectedStudent.semester ? ` · Semester ${selectedStudent.semester}` : ''}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Requests</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{selectedStudent.requestCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Active</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{selectedStudent.activeRequestCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Projects</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{selectedStudent.requestCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">History</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Full</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Past Requests</h3>
              {selectedStudent.requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No request history available for this student.
                </div>
              ) : (
                selectedStudent.requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-[var(--accent)]" />
                          <p className="font-semibold text-[var(--text-primary)]">{request.purpose}</p>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Status: {request.status} · Faculty: {request.facultyName ?? 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-full bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                          <Package size={15} /> Components
                        </div>
                        <div className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                          {request.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3">
                              <span>{item.componentName}</span>
                              <span>Qty {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                          <Clock3 size={15} /> Timeline
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                          <p>Approved: {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : 'Pending'}</p>
                          <p>Issued: {request.issuedAt ? new Date(request.issuedAt).toLocaleString() : 'Pending'}</p>
                          <p>Due: {request.dueAt ? new Date(request.dueAt).toLocaleDateString() : 'N/A'}</p>
                          <p>Returned: {request.returnedAt ? new Date(request.returnedAt).toLocaleDateString() : 'Pending'}</p>
                        </div>
                      </div>
                    </div>

                    {request.fines.length > 0 ? (
                      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--warning-light)] p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--warning)]">
                          <IndianRupee size={15} /> Fines
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                          {request.fines.map((fine, index) => (
                            <p key={`${request.id}-${index}`}>
                              {fine.reason}: ₹{fine.amount} · {fine.status}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-secondary)]">
            Select a student to view their complete request history.
          </div>
        )}
      </div>
    </div>
  );
}