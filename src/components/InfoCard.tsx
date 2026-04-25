import React from 'react';

type Props = {
  id: string;
  title: string;
  content: string;
  pinned?: boolean;
  authorRole?: string;
  createdAt?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function InfoCard({ title, content, pinned, authorRole, createdAt, onClick, onEdit, onDelete }: Props) {
  const excerpt = content ? (content.length > 120 ? content.slice(0, 117) + '...' : content) : '';

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: '200px',
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h3>
        {pinned && <span style={{ background: 'var(--accent)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '12px' }}>Pinned</span>}
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, flex: 1 }}>{excerpt}</p>
      <div style={{ marginTop: '16px', fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span>{authorRole}</span>
        <span>{createdAt ? new Date(createdAt).toLocaleDateString() : ''}</span>
      </div>
      {(onEdit || onDelete) && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Edit</button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--danger)', color: 'white', cursor: 'pointer' }}>Delete</button>
          )}
        </div>
      )}
    </div>
  );
}
