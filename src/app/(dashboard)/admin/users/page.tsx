"use client";

import React from 'react';

export const dynamic = 'force-dynamic';

export default function Users() {
  const state = useUsersState();

  return (
    <UsersContext.Provider value={state}>
      <div>
        <h1 className="text-2xl font-extrabold mb-3">User Management</h1>
        <p className="text-sm text-muted-foreground mb-4">Search, filter, and inspect student & faculty records.</p>

        <div className="flex items-center gap-4 mb-4">
          <TabBar />
          <div className="ml-auto flex items-center gap-3">
            <SearchBox />
            <a href="/admin/users/create" className="no-underline">
              <button className="bg-accent text-white px-3 py-1.5 rounded-md">+ Create User</button>
            </a>
          </div>
        </div>

        <UserDirectoryInner />
      </div>
    </UsersContext.Provider>
  );
}

function TabBar() {
  const { tab, setTab } = useUsersContext();
  const tabStyle = (t: string) => ({
    padding: '0.4rem 0.8rem', borderRadius: 8, cursor: 'pointer', border: tab === t ? '1px solid var(--accent)' : '1px solid transparent', background: tab === t ? 'rgba(59,130,246,0.08)' : 'transparent',
  });

  return (
    <div className="flex gap-2">
      <div onClick={() => setTab('all')} className={tab === 'all' ? 'px-3 py-1 rounded-md border border-accent bg-accent/10 cursor-pointer' : 'px-3 py-1 rounded-md cursor-pointer'}>All</div>
      <div onClick={() => setTab('students')} className={tab === 'students' ? 'px-3 py-1 rounded-md border border-accent bg-accent/10 cursor-pointer' : 'px-3 py-1 rounded-md cursor-pointer'}>Students</div>
      <div onClick={() => setTab('faculty')} className={tab === 'faculty' ? 'px-3 py-1 rounded-md border border-accent bg-accent/10 cursor-pointer' : 'px-3 py-1 rounded-md cursor-pointer'}>Faculty</div>
    </div>
  );
}

function SearchBox() {
  const { query, setQuery } = useUsersContext();
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search name, email, roll..."
      className="px-3 py-1 rounded-md border border-input min-w-[220px]"
    />
  );
}

/* Context to share filters/state */
function useUsersState() {
  const [tab, setTab] = React.useState<'all' | 'students' | 'faculty'>('students');
  const [query, setQuery] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  return { tab, setTab, query, setQuery, selectedUserId, setSelectedUserId };
}

const UsersContext = React.createContext<any>(null);
function useUsersContext() {
  const ctx = React.useContext(UsersContext);
  if (!ctx) throw new Error('useUsersContext must be used within provider');
  return ctx;
}

function UserDirectory() {
  const state = useUsersState();
  return (
    <UsersContext.Provider value={state}>
      <UserDirectoryInner />
    </UsersContext.Provider>
  );
}

function UserDirectoryInner() {
  const { tab, query, selectedUserId, setSelectedUserId } = useUsersContext();
  const [loading, setLoading] = React.useState(true);
  const [students, setStudents] = React.useState<any[]>([]);
  const [faculty, setFaculty] = React.useState<any[]>([]);
  const [history, setHistory] = React.useState<any[]>([]);
  const [labs, setLabs] = React.useState<any[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        setLoading(true);
        const [studentsRes, facultyRes, historyRes, labsRes] = await Promise.all([
          fetch('/api/students/overview'),
          fetch('/api/faculty'),
          fetch('/api/lab-access/history'),
          fetch('/api/labs'),
        ]);

        const studentsData = await studentsRes.json().catch(() => ({}));
        const facultyData = await facultyRes.json().catch(() => ({}));
        const historyData = await historyRes.json().catch(() => ({}));
        const labsData = await labsRes.json().catch(() => ({}));

        if (!mounted) return;

        setStudents(Array.isArray(studentsData.data) ? studentsData.data : []);
        setFaculty(Array.isArray(facultyData.data) ? facultyData.data : []);
        setHistory(Array.isArray(historyData.data) ? historyData.data : []);
        setLabs(Array.isArray(labsData.data) ? labsData.data : []);
      } catch (e) {
        setError('Failed to load directory');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse mb-3 p-3 rounded-md bg-slate-800">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div>
          <div className="animate-pulse p-4 rounded-md bg-slate-800 h-64">
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  // build list depending on tab
  let list: any[] = [];
  if (tab === 'students') list = students;
  else if (tab === 'faculty') list = faculty.map((f) => ({ ...f, role: 'FACULTY' }));
  else list = [...students, ...faculty.map((f) => ({ ...f, role: 'FACULTY' }))];

  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((u) => {
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.rollNumber && String(u.rollNumber).toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    });
  }

  if (list.length === 0) return <div style={{ color: 'var(--text-secondary)' }}>No matches.</div>;

  // two-column layout: left list, right detail pane
  return (
    <div className="grid grid-cols-[360px_1fr] gap-4 items-start">
      <div className="h-[72vh] overflow-y-auto pr-2">
        {list.map((u) => {
          const active = selectedUserId === u.id;
          return (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`mb-3 p-3 rounded-md cursor-pointer ${active ? 'bg-slate-800 border border-accent' : 'bg-card border border-border'} hover:bg-slate-800`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex gap-3 items-center">
                  <Avatar name={u.name} />
                  <div>
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{u.department ?? ''}</div>
                  <div className="text-[12px]">{u.rollNumber ?? ''}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[72vh] overflow-y-auto p-4 rounded-md border border-border bg-background">
        {selectedUserId ? (
          (() => {
            const user = [...students, ...faculty.map((f) => ({ ...f, role: 'FACULTY' }))].find((x) => x.id === selectedUserId);
            if (!user) return <div className="text-muted-foreground">Selected user not found.</div>;
            return user.role === 'FACULTY' || user.role === 'faculty' ? (
              <FacultyDetails faculty={user} labs={labs} history={history} />
            ) : (
              <StudentDetails student={user} history={history} />
            );
          })()
        ) : (
          <div className="text-muted-foreground">Select a user to see details.</div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = (name || '')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">{initials || 'U'}</div>
  );
}

function StudentDetails({ student, history }: { student: any; history: any[] }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Requests ({student.requestCount})</div>
      {student.requests && student.requests.length > 0 ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {student.requests.map((r: any) => (
            <div key={r.id} style={{ padding: 8, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600 }}>{r.purpose ?? 'Lab Request'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.status}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : ''}</div>
              {r.items && r.items.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Items:</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {r.items.map((it: any) => (
                      <li key={it.id} style={{ fontSize: 13 }}>{it.componentName} x {it.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>No requests found.</div>
      )}

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Access History</div>
        {history.filter((h) => h.studentId === student.id).length ? (
          history.filter((h) => h.studentId === student.id).map((h) => (
            <div key={h.id} style={{ padding: 8, borderRadius: 8, marginBottom: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13 }}>{h.labName} — {h.status}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.accessGrantedAt ? new Date(h.accessGrantedAt).toLocaleString() : ''}</div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>No access history.</div>
        )}
      </div>
    </div>
  );
}

function FacultyDetails({ faculty, labs, history }: { faculty: any; labs: any[]; history: any[] }) {
  const myLabs = labs.filter((l) => l.responsibleFacultyId === faculty.id);
  const myHistory = history.filter((h) => h.facultyId === faculty.id);

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Responsible Labs ({myLabs.length})</div>
      {myLabs.length ? (
        myLabs.map((l) => (
          <div key={l.id} style={{ padding: 8, borderRadius: 8, marginBottom: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600 }}>{l.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.location}</div>
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>No labs assigned.</div>
      )}

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Access History</div>
        {myHistory.length ? (
          myHistory.map((h) => (
            <div key={h.id} style={{ padding: 8, borderRadius: 8, marginBottom: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13 }}>{h.labName} — {h.status}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.accessGrantedAt ? new Date(h.accessGrantedAt).toLocaleString() : ''}</div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>No access history.</div>
        )}
      </div>
    </div>
  );
}
