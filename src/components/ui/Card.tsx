import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export function Card({ className, hover, glow, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5',
        hover && 'hover:border-[var(--border-2)] hover:bg-[var(--surface-2)] transition-all duration-200 cursor-pointer',
        glow && 'shadow-lg shadow-emerald-900/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
