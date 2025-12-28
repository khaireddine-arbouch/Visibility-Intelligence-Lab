'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-signal-red bg-signal-red/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-signal-red shrink-0" />
              <h2 className="text-lg font-semibold text-signal-red">Something went wrong</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. This has been logged for investigation.
            </p>
            {this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-background border border-border overflow-x-auto font-mono">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleReset} className="w-full">
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

