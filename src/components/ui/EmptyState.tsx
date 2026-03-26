'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: { label: string; href: string };
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '56px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border)',
        backgroundColor: 'var(--bg-surface)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}
    >
      <Icon size={48} style={{ color: 'var(--text-muted)' }} />
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          {subtitle}
        </div>
      </div>

      {action ? (
        <Link
          href={action.href}
          style={{
            marginTop: '6px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
