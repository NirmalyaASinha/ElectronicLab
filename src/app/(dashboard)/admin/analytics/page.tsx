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

        setMetrics({ users: usersCount, labs: labsCount, requests: requestsCount, activeAccess: activeCount });
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

      <div style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
        <p>More charts and breakdowns can be added here (requests by status, fines total, component usage, etc.).</p>
      </div>
    </div>
  );
}
