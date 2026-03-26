export const dynamic = 'force-dynamic';

export default function AdminHome() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
        Admin Dashboard 🔧
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
            🏭 Inventory Management
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Add and manage components in the system
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
            👥 User Management
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Create and manage user accounts and roles
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
            📊 Analytics
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            View system statistics and reports
          </p>
        </div>
      </div>
    </div>
  );
}
