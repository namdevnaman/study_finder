import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Boundary caught an error:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-display text-5xl font-semibold tracking-tight text-primary">Oops</p>
        <p className="max-w-sm text-sm text-muted">
          Something went wrong on this page. Your other tabs still work, and your data is safe.
        </p>
        <p className="max-w-md truncate font-mono text-xs text-muted">{this.state.error.message}</p>
        <div className="flex items-center gap-2.5">
          <Link
            to="/app"
            onClick={() => this.setState({ error: null })}
            className="btn btn-primary btn-md"
          >
            Back to dashboard
          </Link>
          <button
            onClick={() => this.setState({ error: null })}
            className="btn btn-secondary btn-md"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}