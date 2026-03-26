'use client'

interface SectionLabelProps {
  children: string
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  )
}
