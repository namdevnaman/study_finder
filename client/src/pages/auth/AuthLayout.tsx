import type { ReactNode } from 'react'
import { BookOpenCheck, GraduationCap, Users, MessageSquare } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: Users, text: 'Create and join study groups with classmates' },
  { icon: MessageSquare, text: 'Ask doubts, start discussions, and collaborate' },
  { icon: GraduationCap, text: 'Share notes and resources by subject and topic' },
]

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(60% 60% at 80% 0%, rgba(99,102,241,0.5) 0%, transparent 60%), radial-gradient(50% 50% at 0% 100%, rgba(22,163,74,0.35) 0%, transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-2 text-bone-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <BookOpenCheck className="h-6 w-6" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold">Study Finders</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-bone-50">
            Study smarter, together — on your campus.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-50/80">
            Study Group Finder helps you find study partners, schedule sessions, and share resources with students from your own college.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-bone-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-bone-50/60">
          Built for college campuses · One campus, one community
        </p>
      </div>
    </div>
  )
}