'use client';

import { useEffect, useState, useCallback } from 'react';
import { Crown, Check, RotateCcw, Sparkles, ShoppingCart, Zap, Share2, Printer, FileDown, LayoutGrid } from 'lucide-react';
import type { RCOffering, RCPackage } from '@/lib/revenuecat';

const FEATURES = [
  { icon: Sparkles,   label: 'AI weekly meal suggestions' },
  { icon: LayoutGrid, label: 'Month view calendar' },
  { icon: Zap,        label: 'AI grocery organizer' },
  { icon: Share2,     label: 'Share grocery list' },
  { icon: Printer,    label: 'Print & PDF export' },
  { icon: ShoppingCart, label: 'Order groceries online' },
  { icon: FileDown,   label: 'Event menu PDF export' },
];

interface Props {
  onPremiumActivated: () => void;
}

export default function IAPPaywall({ onPremiumActivated }: Props) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [offering, setOffering] = useState<RCOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { getOffering } = await import('@/lib/revenuecat');
        setOffering(await getOffering());
      } catch {
        setError('Could not load pricing. Please try again.');
      } finally {
        setOfferingLoading(false);
      }
    })();
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!offering) return;
    const pkg: RCPackage | null = plan === 'yearly' ? offering.yearly : offering.monthly;
    if (!pkg) {
      setError('This plan is not available right now.');
      return;
    }

    setPurchasing(true);
    setError('');
    try {
      const { purchasePackage } = await import('@/lib/revenuecat');
      const result = await purchasePackage(pkg);
      if (!result.success) {
        if (!result.cancelled) setError(result.error);
        return;
      }

      const res = await fetch('/api/iap/verify', { method: 'POST' });
      const json = await res.json() as { isPremium: boolean };
      if (json.isPremium) {
        onPremiumActivated();
      } else {
        setError('Purchase recorded but activation is pending. Please restart the app.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [offering, plan, onPremiumActivated]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    setRestoreMsg('');
    try {
      const { restorePurchases } = await import('@/lib/revenuecat');
      const { isPremium } = await restorePurchases();
      if (isPremium) {
        await fetch('/api/iap/verify', { method: 'POST' });
        onPremiumActivated();
      } else {
        setRestoreMsg('No active subscription found.');
      }
    } catch {
      setRestoreMsg('Restore failed. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, [onPremiumActivated]);

  const monthlyPrice = offering?.monthly?.product.priceString ?? '$4.99';
  const yearlyPrice  = offering?.yearly?.product.priceString  ?? '$41.99';

  return (
    <div className="rounded-2xl border border-amber-500/20 overflow-hidden mb-6"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #161c28 100%)' }}>

      {/* Header */}
      <div className="px-6 py-6 text-center border-b border-amber-500/10"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02))' }}>
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <Crown size={24} className="text-black" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Upgrade to Premium</h2>
        <p className="text-sm text-[var(--text-muted)]">Unlock AI meal planning and 7 premium features</p>
      </div>

      {/* Features */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="grid grid-cols-1 gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check size={11} className="text-emerald-400" />
              </div>
              <span className="text-sm text-[var(--text)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan toggle */}
      <div className="px-6 pt-5">
        <div className="flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 mb-4">
          <button
            onClick={() => setPlan('yearly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
              plan === 'yearly' ? 'text-black' : 'text-[var(--text-muted)]'
            }`}
            style={plan === 'yearly' ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' } : {}}
          >
            <span className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${plan === 'yearly' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-400'}`}>
                BEST VALUE
              </span>
              Yearly
            </span>
            {offeringLoading ? (
              <span className="text-[11px] opacity-60">Loading…</span>
            ) : (
              <span className={`text-[11px] font-bold ${plan === 'yearly' ? 'text-black/70' : 'text-amber-400'}`}>
                {yearlyPrice}/yr
              </span>
            )}
          </button>
          <button
            onClick={() => setPlan('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
              plan === 'monthly' ? 'text-black' : 'text-[var(--text-muted)]'
            }`}
            style={plan === 'monthly' ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' } : {}}
          >
            <span>Monthly</span>
            {offeringLoading ? (
              <span className="text-[11px] opacity-60">Loading…</span>
            ) : (
              <span className={`text-[11px] font-semibold ${plan === 'monthly' ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>
                {monthlyPrice}/mo
              </span>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={purchasing || offeringLoading || !offering}
          className="w-full py-4 rounded-xl font-bold text-base text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 24px rgba(245,158,11,0.35)' }}
        >
          {purchasing ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Crown size={16} />
              {plan === 'yearly' ? `Get Premium — ${yearlyPrice}/year` : `Get Premium — ${monthlyPrice}/month`}
            </>
          )}
        </button>

        {/* Restore */}
        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
          >
            <RotateCcw size={11} />
            {restoring ? 'Restoring…' : 'Restore purchases'}
          </button>
        </div>

        {restoreMsg && (
          <p className="text-center text-xs text-[var(--text-muted)] pb-3">{restoreMsg}</p>
        )}

        {/* Apple legal requirement */}
        <p className="text-center text-[10px] text-[var(--text-muted)] leading-relaxed pb-5 px-2">
          Payment charged to your Apple ID at confirmation. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID Account Settings.
        </p>
      </div>
    </div>
  );
}
