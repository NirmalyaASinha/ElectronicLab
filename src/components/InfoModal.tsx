 'use client';
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
  authorRole?: string;
  createdAt?: string;
};

export default function InfoModal({ open, onClose, title, content, authorRole, createdAt }: Props) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ width: 'min(900px, 96%)', maxHeight: '90vh', overflow: 'auto', background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{authorRole} • {createdAt ? new Date(createdAt).toLocaleString() : ''}</div>
        </div>
        <div style={{ marginTop: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {/* render markdown/plain text; keep simple for now */}
          <div>{content}</div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}
