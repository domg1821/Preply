'use client';
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <RefreshCw size={20} className="text-red-400" />
          </div>
          <p className="text-[var(--text)] font-semibold mb-1">Something went wrong</p>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-xs">
            An unexpected error occurred. Try refreshing this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
          >
            Try again →
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
