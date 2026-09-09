import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'accent' | 'neutral' | 'danger' | 'outline'

const variantClass: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  accent: 'badge-accent',
  neutral: 'badge-neutral',
  danger: 'badge-danger',
  outline: 'badge-outline',
}

export function Badge({ variant = 'neutral', className = '', children }: { variant?: BadgeVariant; className?: string; children: ReactNode }) {
  return <span className={`${variantClass[variant]} ${className}`}>{children}</span>
}