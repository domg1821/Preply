'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          {
            'bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white shadow-lg shadow-emerald-900/30': variant === 'primary',
            'bg-[var(--surface-2)] hover:bg-[var(--border-2)] text-[var(--text)] border border-[var(--border)]': variant === 'secondary',
            'bg-transparent hover:bg-[var(--surface-2)] text-[var(--text-dim)] hover:text-[var(--text)]': variant === 'ghost',
            'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20': variant === 'danger',
            'bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black font-semibold': variant === 'accent',
          },
          {
            'text-xs px-3 py-1.5 h-8': size === 'sm',
            'text-sm px-4 py-2 h-10': size === 'md',
            'text-base px-6 py-3 h-12': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
