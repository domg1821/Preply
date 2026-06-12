'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 9999, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col',
          {
            'sm:max-w-sm': size === 'sm',
            'sm:max-w-lg': size === 'md',
            'sm:max-w-2xl': size === 'lg',
            'sm:max-w-4xl': size === 'xl',
          }
        )}
        style={{ maxHeight: 'calc(92vh - env(safe-area-inset-top))' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div
          className="p-6 overflow-y-auto overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
