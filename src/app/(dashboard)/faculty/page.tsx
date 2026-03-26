export const dynamic = 'force-dynamic';

export default function FacultyHome() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
        Welcome, Faculty! 👋
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            ✅ Pending Approvals
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Review and approve student requests
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            📤 Issued Components
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track issued items and due dates
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            📥 Process Returns
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Record component returns and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
