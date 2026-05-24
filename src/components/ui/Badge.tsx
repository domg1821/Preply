import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'muted' | 'success' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': variant === 'primary',
          'bg-amber-500/10 text-amber-400 border border-amber-500/20': variant === 'accent',
          'bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--border)]': variant === 'muted',
          'bg-green-500/10 text-green-400 border border-green-500/20': variant === 'success',
          'bg-red-500/10 text-red-400 border border-red-500/20': variant === 'danger',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
