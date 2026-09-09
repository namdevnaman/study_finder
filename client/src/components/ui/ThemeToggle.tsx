import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const OPTIONS = [
  { mode: 'light' as const, icon: Sun, label: 'Light' },
  { mode: 'dark' as const, icon: Moon, label: 'Dark' },
  { mode: 'system' as const, icon: Monitor, label: 'System' },
]

/** Compact segmented theme switcher. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5 ${className}`}
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ mode: m, icon: Icon, label }) => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} mode`}
            title={`${label} mode`}
            onClick={() => setMode(m)}
            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors ${
              active ? 'bg-surface text-primary shadow-card' : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}