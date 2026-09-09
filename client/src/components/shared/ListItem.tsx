import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Compact, information-dense list row (WhatsApp-inspired pattern):
 *  [Leading]  Title
 *             Subtitle
 *             Meta line
 *                              [Right: timestamp/badge]
 */
export function ListItem({
  to,
  leading,
  title,
  titleClassName = '',
  subtitle,
  meta,
  right,
  onClick,
  ariaLabel,
}: {
  to?: string
  leading?: ReactNode
  title: ReactNode
  titleClassName?: string
  subtitle?: ReactNode
  meta?: ReactNode
  right?: ReactNode
  onClick?: () => void
  ariaLabel?: string
}) {
  const content = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium text-foreground ${titleClassName}`}>{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-muted">{subtitle}</span>}
        {meta && <span className="mt-0.5 block truncate text-xs text-muted/80">{meta}</span>}
      </span>
      {right && <span className="flex shrink-0 flex-col items-end gap-1">{right}</span>}
    </>
  )

  const base =
    'flex min-w-0 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted'

  if (to) {
    return (
      <Link to={to} onClick={onClick} aria-label={ariaLabel} className={`${base} cursor-pointer`}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`${base} cursor-pointer`}>
      {content}
    </button>
  )
}

/** Unread dot / count indicator used in list rows and nav. */
export function UnreadBadge({ count, dot = false }: { count: number; dot?: boolean }) {
  if (count <= 0) return null
  if (dot) {
    return <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-label={`${count} unread`} />
  }
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">
      {count > 9 ? '9+' : count}
    </span>
  )
}