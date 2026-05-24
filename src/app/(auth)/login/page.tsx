'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChefHat, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'confirmation_failed') {
      setError('Email confirmation failed. Please try the link again or request a new one.');
    } else if (urlError === 'auth_failed') {
      setError('Authentication failed. Please try signing in again.');
    }
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
    if (!email) {
      setError('Enter your email address above first.');
      return;
    }
    setResendLoading(true);
    const supabase = createClient();
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    setResendLoading(false);
    setResendSent(true);
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 flex flex-col gap-2">
          <p>{error}</p>
          {needsConfirmation && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendSent}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors disabled:opacity-50"
            >
              <Mail size={12} />
              {resendSent ? 'Confirmation email sent!' : resendLoading ? 'Sending…' : 'Resend confirmation email'}
            </button>
          )}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <ChefHat size={24} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-8">Sign in to your Preply account</p>

        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-[var(--surface)]" />}>
          <LoginForm />
        </Suspense>

        <p className="text-sm text-center text-[var(--text-muted)] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
