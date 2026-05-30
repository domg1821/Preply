'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/capacitor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // Email confirmation is off — session returned immediately
      router.push('/home');
      router.refresh();
    } else {
      // Email confirmation is on — show "check your email"
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            We sent a confirmation link to
          </p>
          <p className="text-sm font-semibold text-[var(--text)] mb-6">{email}</p>
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-left mb-6">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Click the link in your email to confirm your account, then come back and sign in.
              Check your spam folder if you don&apos;t see it within a minute.
            </p>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
          >
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      {/* Subtle glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)' }}>
          {/* Top accent */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10B981, #059669)' }} />

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow-primary"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <ChefHat size={22} className="text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-1">Create your account</h1>
            <p className="text-sm text-[var(--text-muted)] text-center mb-7">Free forever. Upgrade anytime.</p>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <Input
                id="name"
                type="text"
                label="Full name"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
                Create account
              </Button>
            </form>

            <p className="text-sm text-center text-[var(--text-muted)] mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
