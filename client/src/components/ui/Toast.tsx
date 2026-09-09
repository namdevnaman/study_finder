import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info' | 'neutral'

interface Toast {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, description?: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const kindStyles: Record<ToastKind, { bar: string; icon: string }> = {
  success: { bar: 'bg-accent', icon: '✓' },
  error: { bar: 'bg-danger', icon: '!' },
  info: { bar: 'bg-primary', icon: 'i' },
  neutral: { bar: 'bg-ink-500', icon: '' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++idRef.current
      setToasts((current) => [...current, { id, kind, title, description }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value: ToastContextValue = {
    toast,
    success: (title, description) => toast('success', title, description),
    error: (title, description) => toast('error', title, description),
    info: (title, description) => toast('info', title, description),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="toast pointer-events-auto w-full max-w-sm animate-scale-in" role="status">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${kindStyles[t.kind].bar}`}>
              {kindStyles[t.kind].icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}