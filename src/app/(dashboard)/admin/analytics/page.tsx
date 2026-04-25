"use client";

import React from 'react';

export const dynamic = 'force-dynamic';

export default function Analytics() {
  return <AdminAnalytics />;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function AdminAnalytics() {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState({ users: 0, labs: 0, requests: 0, activeAccess: 0 });
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [studentsRes, labsRes, requestsRes, historyRes] = await Promise.all([
          fetch('/api/students/overview'),
          fetch('/api/labs'),
          fetch('/api/lab-access/requests'),
          fetch('/api/lab-access/history'),
        ]);

        const studentsData = await studentsRes.json().catch(() => ({}));
        const labsData = await labsRes.json().catch(() => ({}));
        const requestsData = await requestsRes.json().catch(() => ({}));
        const historyData = await historyRes.json().catch(() => ({}));

        if (!mounted) return;

        const usersCount = Array.isArray(studentsData.data) ? studentsData.data.length : 0;
        const labsCount = Array.isArray(labsData.data) ? labsData.data.length : 0;
        const requestsCount = Array.isArray(requestsData.data) ? requestsData.data.length : 0;
        const activeCount = Array.isArray(historyData.data) ? historyData.data.filter((h: any) => h.status === 'ACTIVE').length : 0;

        // derive counts by status for requests (requestsData.data)
        const statusesCount: Record<string, number> = {};
        if (Array.isArray(requestsData.data)) {
          for (const r of requestsData.data) {
            const s = (r.status || 'UNKNOWN').toString();
            statusesCount[s] = (statusesCount[s] || 0) + 1;
          }
        }

        setMetrics({ users: usersCount, labs: labsCount, requests: requestsCount, activeAccess: activeCount });
        setStatusCounts(statusesCount);
      } catch (e) {
        setError('Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const [statusCounts, setStatusCounts] = React.useState<Record<string, number>>({});

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1.5rem' }}>Analytics Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total Students" value={metrics.users} />
        <MetricCard label="Labs" value={metrics.labs} />
        <MetricCard label="Lab Requests" value={metrics.requests} />
        <MetricCard label="Active Access Sessions" value={metrics.activeAccess} />
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, marginTop: 12, alignItems: 'start' }}>
        <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Requests by Status</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <DonutChart counts={statusCounts} size={160} />
            <div style={{ flex: 1 }}>
              <StatusLegend counts={statusCounts} />
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Status Distribution</h3>
          <HorizontalBar counts={statusCounts} />
        </div>
      </section>
    </div>
  );
}

function pickColors(keys: string[]) {
  const palette = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4', '#F97316'];
  return keys.map((k, i) => palette[i % palette.length]);
}

function DonutChart({ counts, size = 140 }: { counts: Record<string, number>; size?: number }) {
  const keys = Object.keys(counts);
  const total = keys.reduce((s, k) => s + (counts[k] || 0), 0) || 1;
  const colors = pickColors(keys);

  let cumulative = 0;
  const segments = keys.map((k, i) => {
    const value = counts[k] || 0;
    const start = cumulative / total;
    cumulative += value;
    const end = cumulative / total;
    const large = end - start > 0.5 ? 1 : 0;
    const radius = size / 2;
    const thickness = Math.max(18, Math.floor(size * 0.18));
    const r = radius - thickness / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (end - start) * circumference;
    const gap = circumference - dash;
    const rotation = start * 360 - 90;
    return { key: k, color: colors[i], dash, gap, rotation, radius: r, thickness };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        {segments.map((s, idx) => (
          <circle
            key={s.key}
            r={s.radius}
            fill="none"
            stroke={s.color}
            strokeWidth={s.thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            transform={`rotate(${s.rotation})`}
            strokeLinecap="round"
          />
        ))}
        <circle r={size * 0.28} fill="var(--bg-surface)" stroke="transparent" />
        <text x="0" y="4" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--text-primary)' }}>
          {Object.values(counts).reduce((s, v) => s + v, 0)}
        </text>
        <text x="0" y="22" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-secondary)' }}>
          Requests
        </text>
      </g>
    </svg>
  );
}

function StatusLegend({ counts }: { counts: Record<string, number> }) {
  const keys = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const colors = pickColors(keys);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {keys.map((k, i) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: colors[i] }} />
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{k}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{counts[k] || 0}</div>
        </div>
      ))}
    </div>
  );
}

function HorizontalBar({ counts }: { counts: Record<string, number> }) {
  const keys = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const total = keys.reduce((s, k) => s + (counts[k] || 0), 0) || 1;
  const colors = pickColors(keys);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {keys.map((k, i) => {
        const val = counts[k] || 0;
        const pct = Math.round((val / total) * 100);
        return (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{k}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{val} — {pct}%</div>
            </div>
            <div style={{ height: 12, background: 'var(--bg-surface)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: 8 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
