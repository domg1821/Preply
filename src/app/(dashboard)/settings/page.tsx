'use client';
import { useState, useEffect } from 'react';
import { LogOut, Trash2, ChefHat, Target, Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [userEmail,        setUserEmail]        = useState('');
  const [userName,         setUserName]         = useState('');
  const [signingOut,       setSigningOut]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading,    setDeleteLoading]    = useState(false);
  const [deleteError,      setDeleteError]      = useState('');

  // Macro goals
  const [goalCal,     setGoalCal]     = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarbs,   setGoalCarbs]   = useState('');
  const [goalFat,     setGoalFat]     = useState('');
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsSaved,  setGoalsSaved]  = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? '');
      setUserName(user.user_metadata?.full_name ?? '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('macro_goals')
        .eq('id', user.id)
        .single();
      if (profile?.macro_goals) {
        setGoalCal(String(profile.macro_goals.calories ?? ''));
        setGoalProtein(String(profile.macro_goals.protein ?? ''));
        setGoalCarbs(String(profile.macro_goals.carbs ?? ''));
        setGoalFat(String(profile.macro_goals.fat ?? ''));
      }
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function handleSaveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoals(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingGoals(false); return; }
    await supabase.from('profiles').update({
      macro_goals: {
        calories: Number(goalCal)     || null,
        protein:  Number(goalProtein) || null,
        carbs:    Number(goalCarbs)   || null,
        fat:      Number(goalFat)     || null,
      },
    }).eq('id', user.id);
    setSavingGoals(false);
    setGoalsSaved(true);
    setTimeout(() => setGoalsSaved(false), 2500);
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

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Settings</h1>

      {/* ── Profile card ────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Gradient banner */}
        <div
          className="h-16"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2), rgba(139,92,246,0.2))' }}
        />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-7 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold text-white shrink-0 border-2"
              style={{
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                borderColor: 'var(--surface)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              {initials}
            </div>
          </div>
          {userName && <p className="font-bold text-[var(--text)]">{userName}</p>}
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{userEmail || '—'}</p>
        </div>
      </div>

      {/* ── Macro Goals ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-2 px-5 py-3 border-b"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(236,72,153,0.15)' }}>
            <Target size={13} style={{ color: '#EC4899' }} />
          </div>
          <p className="text-sm font-bold text-[var(--text)]">Daily Macro Goals</p>
          <p className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Used in Nutrition page</p>
        </div>
        <form onSubmit={handleSaveGoals} className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Calories',  val: goalCal,     set: setGoalCal,     placeholder: '2000', color: '#F59E0B', unit: 'kcal' },
              { label: 'Protein',   val: goalProtein, set: setGoalProtein, placeholder: '150',  color: '#10B981', unit: 'g' },
              { label: 'Carbs',     val: goalCarbs,   set: setGoalCarbs,   placeholder: '250',  color: '#06B6D4', unit: 'g' },
              { label: 'Fat',       val: goalFat,     set: setGoalFat,     placeholder: '65',   color: '#8B5CF6', unit: 'g' },
            ].map(({ label, val, set, placeholder, color, unit }) => (
              <div key={label}>
                <label className="block text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                  {label} <span className="font-normal" style={{ color: 'var(--text-muted)' }}>({unit})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={savingGoals}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: goalsSaved
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #EC4899, #8B5CF6)',
              boxShadow: `0 4px 16px ${goalsSaved ? 'rgba(34,197,94,0.3)' : 'rgba(236,72,153,0.3)'}`,
            }}
          >
            {savingGoals
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : goalsSaved
              ? <><Check size={15} />Saved!</>
              : <><Save size={15} />Save Goals</>}
          </button>
        </form>
      </div>

      {/* ── Sign out ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all disabled:opacity-50 text-left"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={16} className="shrink-0" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {/* ── Danger zone ──────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="px-5 py-3 border-b"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-500/70">Danger Zone</p>
        </div>
        <div className="p-5">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              <Trash2 size={14} />Delete account
            </button>
          ) : (
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Delete your account?</p>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                This permanently deletes all your recipes, meal plans, grocery lists, and account data. This cannot be undone.
              </p>
              {deleteError && <p className="text-xs text-red-400 mb-3">{deleteError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: '#EF4444' }}
                >
                  {deleteLoading
                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Trash2 size={13} />}
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                  disabled={deleteLoading}
                  className="text-sm transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}>
          <ChefHat size={12} className="text-white" />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Preply · Meal Planner</span>
      </div>
    </div>
  );
}
