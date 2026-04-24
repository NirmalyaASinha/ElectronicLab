"use client";

import React from 'react';

export const dynamic = 'force-dynamic';

export default function Users() {
  const state = useUsersState();

  return (
    <UsersContext.Provider value={state}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Search, filter, and inspect student & faculty records.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TabBar />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <SearchBox />
            <a href="/admin/users/create" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.5rem 0.9rem', borderRadius: 10, border: 'none', cursor: 'pointer' }}>+ Create User</button>
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
    <div style={{ display: 'flex', gap: 6 }}>
      <div onClick={() => setTab('all')} style={tabStyle('all')}>All</div>
      <div onClick={() => setTab('students')} style={tabStyle('students')}>Students</div>
      <div onClick={() => setTab('faculty')} style={tabStyle('faculty')}>Faculty</div>
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
      style={{ padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', minWidth: 240 }}
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

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading users...</div>;
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
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 12, alignItems: 'start' }}>
      <div style={{ height: '72vh', overflowY: 'auto', paddingRight: 6 }}>
        {list.map((u) => {
          const active = selectedUserId === u.id;
          return (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              style={{
                borderRadius: 10,
                padding: 10,
                marginBottom: 10,
                background: active ? 'rgba(59,130,246,0.06)' : 'var(--bg-elevated)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.department ?? ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.rollNumber ?? ''}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: '72vh', overflowY: 'auto', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
        {selectedUserId ? (
          (() => {
            const user = [...students, ...faculty.map((f) => ({ ...f, role: 'FACULTY' }))].find((x) => x.id === selectedUserId);
            if (!user) return <div style={{ color: 'var(--text-secondary)' }}>Selected user not found.</div>;
            return user.role === 'FACULTY' || user.role === 'faculty' ? (
              <FacultyDetails faculty={user} labs={labs} history={history} />
            ) : (
              <StudentDetails student={user} history={history} />
            );
          })()
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>Select a user to see details.</div>
        )}
      </div>
    </div>
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
