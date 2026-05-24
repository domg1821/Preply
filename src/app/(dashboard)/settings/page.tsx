'use client';
import { useState } from 'react';
import { Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  }

  const premiumFeatures = [
    'AI-powered meal suggestions',
    'Barcode scanner for instant macros',
    'Multi-week meal planning',
    'Recipe sharing & community library',
    'Export grocery list as PDF',
    'Advanced micronutrient tracking',
    'Unlimited recipe storage',
    'Priority support',
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Settings</h1>

      {/* Premium section */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={20} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-[var(--text)]">Preply Premium</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {premiumFeatures.map((f) => (
            <div key={f} className="flex items-start gap-2 text-sm text-[var(--text-dim)]">
              <Check size={14} className="text-amber-400 mt-0.5 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {/* Plan toggle */}
        <div className="flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 mb-4 max-w-xs">
          {(['monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                plan === p ? 'bg-amber-500 text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {p === 'yearly' ? 'Yearly (save 30%)' : 'Monthly'}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 mb-4">
          <p className="text-3xl font-bold text-[var(--text)]">
            {plan === 'monthly' ? '$4.99' : '$41.99'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-1">/{plan === 'monthly' ? 'mo' : 'yr'}</p>
        </div>

        <Button variant="accent" size="lg" onClick={handleUpgrade} loading={loading}>
          <Crown size={16} />
          Upgrade to Premium
        </Button>
      </div>

      {/* Account section placeholder */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">Account</h2>
        <p className="text-sm text-[var(--text-muted)]">Account settings coming soon.</p>
      </div>
    </div>
  );
}
