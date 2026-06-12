'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open, title, message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm, onCancel,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-bold text-[var(--text)] mb-1.5">{title}</h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-[var(--border)]">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors border-r border-[var(--border)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
