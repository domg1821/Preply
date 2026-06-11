'use client';
import { useState, useEffect } from 'react';
import { LogOut, Trash2, ChefHat } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? '');
      setUserName(user.user_metadata?.full_name ?? '');
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Could not delete account.');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong.');
      setDeleteLoading(false);
    }
  }

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (userEmail[0]?.toUpperCase() ?? '?');

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-[var(--text)] mb-5">Settings</h1>

      {/* Profile */}
      <div className="rounded-2xl border border-[var(--border)] p-5 flex items-center gap-4 mb-4"
        style={{ background: 'var(--surface)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {userName && <p className="font-semibold text-[var(--text)] truncate">{userName}</p>}
          <p className="text-sm text-[var(--text-muted)] truncate">{userEmail || '—'}</p>
        </div>
      </div>

      {/* Sign out */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden mb-4"
        style={{ background: 'var(--surface)' }}>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 text-left"
        >
          <LogOut size={16} className="shrink-0" />
          <span className="font-medium">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-3 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Danger Zone</p>
        </div>
        <div className="p-5">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              Delete account
            </button>
          ) : (
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">Delete your account?</p>
              <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                This permanently deletes all your recipes, meal plans, grocery lists, and account data. This cannot be undone.
              </p>
              {deleteError && <p className="text-xs text-red-400 mb-3">{deleteError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleteLoading
                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Trash2 size={13} />}
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                  disabled={deleteLoading}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <ChefHat size={12} className="text-white" />
        </div>
        <span className="text-xs text-[var(--text-muted)]">Preply · Meal Planner</span>
      </div>
    </div>
  );
}
