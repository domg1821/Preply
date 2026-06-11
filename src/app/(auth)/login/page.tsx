'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChefHat, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/capacitor';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'confirmation_failed') setError('Email confirmation failed. Please try the link again or request a new one.');
    else if (urlError === 'auth_failed') setError('Authentication failed. Please try signing in again.');
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsConfirmation(false);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      if (err.message.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true);
        setError("Your email isn't confirmed yet. Check your inbox for the confirmation link.");
      } else if (err.message.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    } else {
      router.push('/home');
      router.refresh();
    }
  }

  async function handleResend() {
    if (!email) { setError('Enter your email address above first.'); return; }
    setResendLoading(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${getAppUrl()}/api/auth/callback` } });
    setResendLoading(false);
    setResendSent(true);
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-medium text-[var(--text-dim)] mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-dim)] mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 pr-11 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex flex-col gap-2">
          <p>{error}</p>
          {needsConfirmation && (
            <button type="button" onClick={handleResend} disabled={resendLoading || resendSent}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors disabled:opacity-50">
              <Mail size={12} />
              {resendSent ? 'Confirmation email sent!' : resendLoading ? 'Sending…' : 'Resend confirmation email'}
            </button>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.25)' }}
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><span>Sign in</span><ArrowRight size={15} /></>}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-[var(--bg)]">
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 glow-primary"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <ChefHat size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to Preply</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-6 mb-5"
          style={{ background: 'var(--surface)' }}>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-[var(--surface-2)]" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-sm text-center text-[var(--text-muted)]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors font-semibold">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
