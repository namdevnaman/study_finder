/** Horizontal pill filter chips (WhatsApp "All / Unread / Groups" pattern). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface text-muted hover:border-border-strong hover:text-foreground'
            }`}
          >
            {opt.label}
            {typeof opt.count === 'number' && opt.count > 0 && (
              <span
                className={`font-mono text-xs ${active ? 'text-on-primary/80' : 'text-muted'}`}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}