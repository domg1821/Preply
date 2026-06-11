'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/capacitor';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${getAppUrl()}/api/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else if (data.session) {
      router.push('/home');
      router.refresh();
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-[var(--bg)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Mail size={24} className="text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-[var(--text-muted)] mb-1">We sent a confirmation link to</p>
          <p className="text-sm font-semibold text-[var(--text)] mb-5">{email}</p>
          <div className="rounded-2xl border border-[var(--border)] p-4 text-left mb-5"
            style={{ background: 'var(--surface)' }}>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Click the link in your email to confirm your account, then come back and sign in.
              Check your spam folder if you don&apos;t see it within a minute.
            </p>
          </div>
          <Link href="/login" className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-[var(--text)]">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Start planning your meals today</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-6 mb-5"
          style={{ background: 'var(--surface)' }}>
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-dim)] mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex Johnson"
                required
                className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
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
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.25)' }}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-sm text-center text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
