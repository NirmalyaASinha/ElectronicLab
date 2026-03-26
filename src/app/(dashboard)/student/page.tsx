export const dynamic = 'force-dynamic';

export default function StudentHome() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
        Welcome, Student! 👋
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
            📦 Component Inventory
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Browse and request electronics components
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
            📋 My Requests
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track your component requests
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
            ⚠️ Fines
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            View and manage your fines account
          </p>
        </div>
      </div>
    </div>
  );
}
