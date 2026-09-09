import { Link } from 'react-router-dom'
import { BookMarked } from 'lucide-react'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/app" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Study Group Finder home">
      <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-on-primary shadow-card transition-transform duration-150 group-hover:-translate-y-px">
        <BookMarked className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
          Study<span className="text-primary">Finder</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">campus only</span>
      </span>
    </Link>
  )
}