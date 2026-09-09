import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, BookMarked, CalendarClock, Link2, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Logo'

const SUBJECTS = [
  'DBMS',
  'Data Structures',
  'Operating Systems',
  'Calculus II',
  'Discrete Maths',
  'Computer Networks',
  'AI & ML',
  'Software Engineering',
  'DSA Bootcamp',
  'Probability & Stats',
  'Compiler Design',
  'Linear Algebra',
]

const BENTO = [
  {
    span: 'md:col-span-6 lg:col-span-7',
    image: 'https://picsum.photos/seed/campus-library-notes/1200/800',
    icon: Link2,
    title: 'One home for notes',
    body: 'Drive folders, docs, and link for every class material — in one searchable place.',
  },
  {
    span: 'md:col-span-6 lg:col-span-5',
    icon: Users,
    title: 'Small, focused groups',
    body: 'Organizers approve every member, so a group for your hardest subject stays on track.',
  },
  {
    span: 'md:col-span-6 lg:col-span-5',
    icon: MessageSquare,
    title: 'Doubts that move',
    body: 'Questions and comments follow each course, so discussions stay where they belong.',
  },
  {
    span: 'md:col-span-6 lg:col-span-7',
    image: 'https://picsum.photos/seed/whiteboard-revision/1200/800',
    icon: CalendarClock,
    title: 'Sessions you will show up to',
    body: 'Real schedules, attendance check-ins, and reminders before every session starts.',
  },
]

const STEPS = [
  { n: '01', title: 'Create a campus profile', body: 'Sign in with your college email and tell classmates your branch, year, and the subjects that matter to you.' },
  { n: '02', title: 'Start or join a group', body: 'Pick a department, subject, and topic. The organizer approves members, keeping every group focused.' },
  { n: '03', title: 'Study together', body: 'Discuss doubts, share resources, and get nudged when your group plans its next session.' },
]

export default function Landing() {
  const reduce = useReducedMotion()

  const heroAnim = reduce
    ? {}
    : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 } }
  const heroTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }

  const reveal = reduce
    ? {}
    : { initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 } }
  const revealTransition = { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-background">
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground">Features</a>
            <a href="#how" className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[26rem] w-[26rem] rounded-full bg-forest-100/70 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
          {/* Copy */}
          <div className="lg:col-span-7">
            <motion.div
              {...heroAnim}
              transition={{ ...heroTransition, delay: 0.05 }}
              className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Exclusive to your campus
            </motion.div>

            <motion.h1
              {...heroAnim}
              transition={{ ...heroTransition, delay: 0.12 }}
              className="mt-5 max-w-xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-[64px]"
            >
              Find your study crew,{' '}
              <span className="text-primary">before exam season finds you.</span>
            </motion.h1>

            <motion.p
              {...heroAnim}
              transition={{ ...heroTransition, delay: 0.2 }}
              className="mt-5 max-w-md text-lg leading-relaxed text-muted"
            >
              Start a group for the exact subjects you're taking. Share notes, ask doubts, and get answers from people in your program.
            </motion.p>

            <motion.div
              {...heroAnim}
              transition={{ ...heroTransition, delay: 0.28 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/signup">
                <Button size="lg">
                  Create your free profile
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">I have an account</Button>
              </Link>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            {...(reduce ? {} : { initial: { opacity: 0, y: 26, scale: 0.985 }, animate: { opacity: 1, y: 0, scale: 1 } })}
            transition={{ ...heroTransition, delay: 0.3 }}
            className="relative mx-auto w-full max-w-md lg:col-span-5"
          >
            <img
              src="https://picsum.photos/seed/campus-library-study/900/1100"
              alt="Two students revising together over notes in a campus library"
              className="aspect-[8/9] w-full rounded-xl border border-border object-cover shadow-dialog"
              loading="eager"
            />

            <div className="absolute -bottom-8 -left-4 w-72 rounded-xl border border-border bg-surface p-4 shadow-card-hover sm:-left-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Next session · DBMS</p>
              <p className="mt-1.5 font-display text-base font-semibold text-foreground">Normalization drill</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted">Today · 5:30 PM · Library, R-204</p>
                <span className="flex items-center gap-1 font-mono text-xs font-semibold text-amber-700">
                  4 spots left
                </span>
              </div>
            </div>

            <div className="absolute -right-3 -top-5 hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-surface px-3 py-1.5 shadow-card sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-xs font-medium text-foreground">Verified college students</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subject marquee (single marquee for the whole page) */}
      <section aria-hidden className="overflow-hidden border-y border-border bg-surface py-4">
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
              {SUBJECTS.map((subject) => (
                <span key={`${i}-${subject}`} className="flex items-center gap-8 font-mono text-sm uppercase tracking-[0.2em] text-muted">
                  {subject}
                  <span className="h-1 w-1 rounded-full bg-forest-200" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento, varied tiles */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <motion.div {...reveal} transition={revealTransition} className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built for how campus actually works.</h2>
          <p className="mt-3 text-lg text-muted">Groups, notes, and doubts — organised around the subjects you and your seniors are taking right now.</p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {BENTO.map((tile, index) => (
            <motion.article
              key={tile.title}
              {...reveal}
              transition={{ ...revealTransition, delay: index * 0.06 }}
              className={`group relative overflow-hidden rounded-xl border border-border ${tile.image ? 'bg-forest-900 text-bone-50' : 'bg-surface'} ${tile.span}`}
            >
              {tile.image ? (
                <>
                  <img
                    src={tile.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />
                </>
              ) : null}

              <div className="relative flex min-h-64 flex-col justify-end p-7">
                <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tile.image ? 'bg-bone-50/15 text-bone-50' : 'bg-primary-soft text-primary'}`}>
                  <tile.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className={`text-lg font-semibold tracking-tight ${tile.image ? 'text-bone-50' : 'text-foreground'}`}>{tile.title}</h3>
                <p className={`mt-1.5 max-w-md text-sm leading-relaxed ${tile.image ? 'text-bone-50/80' : 'text-muted'}`}>{tile.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* How it works — editorial numbered rows */}
      <section id="how" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <motion.div {...reveal} transition={revealTransition} className="max-w-lg">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From signup to studying together.</h2>
            <p className="mt-3 text-lg text-muted">Three steps. No fluff in between.</p>
          </motion.div>

          <ol className="mt-12">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.n}
                {...reveal}
                transition={{ ...revealTransition, delay: index * 0.08 }}
                className="grid gap-2 border-t border-border py-8 sm:grid-cols-12 sm:gap-6"
              >
                <span className="font-mono text-sm font-medium text-primary sm:col-span-1">{step.n}</span>
                <h3 className="text-xl font-semibold tracking-tight text-foreground sm:col-span-4">{step.title}</h3>
                <p className="max-w-md text-[15px] leading-relaxed text-muted sm:col-span-7">{step.body}</p>
              </motion.li>
            ))}
            <li aria-hidden className="border-t border-border" />
          </ol>

          <motion.p {...reveal} transition={revealTransition} className="mt-10 flex items-center gap-2 text-sm text-muted">
            <BookMarked className="h-4 w-4 text-primary" aria-hidden />
            Every group is tied to a real department, subject, and topic in your curriculum.
          </motion.p>
        </div>
      </section>

      {/* CTA band — one deep brand section */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...reveal}
          transition={revealTransition}
          className="relative overflow-hidden rounded-xl bg-forest-800 px-6 py-16 text-center sm:px-12"
        >
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-forest-500/30 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-amber-500/20 blur-2xl" />

          <div className="relative mx-auto max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-bone-50 sm:text-4xl">Ready to stop studying alone?</h2>
            <p className="mx-auto mt-3 max-w-md text-bone-50/75">
              Set up your profile in under a minute and find a group for your hardest subject.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="border-transparent bg-bone-50 text-forest-800 hover:bg-white">
                  Get started for free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-50/50">College email required · Free for students</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-6">
          <Logo />
          <p className="text-xs text-muted">© {new Date().getFullYear()} Study Finder · Campus-only collaborative learning</p>
        </div>
      </footer>
    </div>
  )
}