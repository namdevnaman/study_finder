import { useState } from 'react'

const AVATAR_PALETTE = ['bg-forest-600', 'bg-forest-500', 'bg-forest-900', 'bg-amber-600', 'bg-ink-800', 'bg-forest-400']

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }[size]

  if (!src || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${AVATAR_PALETTE[initialsOf(name).charCodeAt(0) % AVATAR_PALETTE.length]} ${sizeClass} ${className}`}
      >
        {initialsOf(name)}
      </span>
    )
  }

  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}>
      <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </span>
  )
}