'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, Mail, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
            }}
          >
            <Mail size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--text)]">Check your email</h1>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>We sent a confirmation link to</p>
          <p className="text-sm font-semibold mb-6 text-[var(--text)]">{email}</p>
          <div
            className="rounded-2xl p-4 text-left mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Click the link in your email to confirm your account, then come back and sign in.
              Check your spam folder if you don&apos;t see it within a minute.
            </p>
          </div>
          <Link href="/login" className="text-sm font-semibold transition-colors" style={{ color: 'var(--primary)' }}>
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: 'var(--bg)' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.45), 0 0 0 1px rgba(16,185,129,0.2)',
            }}
          >
            <ChefHat size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Create account</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>Start planning your meals today</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 mb-5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex Johnson"
                required
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-medium text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                boxShadow: '0 4px 24px rgba(16,185,129,0.35)',
              }}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold transition-colors" style={{ color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Sparkles size={12} style={{ color: 'var(--primary)' }} />
          Free forever · No credit card required
        </div>
      </div>
    </div>
  );
}
