import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { AuthLayout } from './AuthLayout'
import { EMAIL_DOMAIN_HINT } from '../../lib/constants'
import { useToast } from '../../components/ui/Toast'

export default function Signup() {
  const { user, signUp } = useAuth()
  const { success } = useToast()
  const [fullName, setFullName] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (user) {
    return <Navigate to="/app" replace />
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    setLoading(true)
    const { error: authError } = await signUp(email.trim(), password, fullName.trim(), collegeName.trim() || undefined)
    setLoading(false)
    if (authError) {
      setError(authError)
      return
    }
    setSent(true)
    success('Account created', 'Check your email to verify your account.')
  }

  if (sent) {
    return (
      <AuthLayout title="Verify your email" subtitle="Almost there">
        <div className="card p-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h2 className="text-base font-semibold text-foreground">Check your inbox</h2>
          <p className="mt-1 text-sm text-muted">
            We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Click it to activate
            your account, then sign in.
          </p>
          <div className="mt-5 flex justify-center">
            <Link to="/login"><Button variant="secondary">Go to sign in</Button></Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join your campus study community">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field id="fullName" label="Full name" required>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>
        <Field id="email" label="College email" hint={EMAIL_DOMAIN_HINT} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field id="collegeName" label="College name" hint="Helps classmates find you">
          <Input
            id="collegeName"
            type="text"
            autoComplete="organization"
            placeholder="e.g. IIT Bombay, VIT Vellore"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            maxLength={80}
          />
        </Field>
        <Field id="password" label="Password" hint="At least 6 characters" required>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">!</span>
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}