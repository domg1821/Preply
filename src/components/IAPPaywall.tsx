'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Crown, Check, RotateCcw, Sparkles, ShoppingCart, Zap, Share2, Printer, FileDown, LayoutGrid, RefreshCw } from 'lucide-react';
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

const PRIVACY_URL = 'https://preply-umber.vercel.app/privacy';
const TERMS_URL   = 'https://preply-umber.vercel.app/terms';

async function openExternalUrl(url: string) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank');
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const retryCount = useRef(0);

  // Load offering with up to 3 automatic retries, 2s apart
  const loadOffering = useCallback(async (attempt = 0) => {
    setOfferingLoading(true);
    if (attempt === 0) setError('');
    try {
      const { getOffering } = await import('@/lib/revenuecat');
      const result = await getOffering();
      setOffering(result);
      // If packages came back null and we have retries left, retry automatically
      if (!result.monthly && !result.yearly && attempt < 3) {
        await sleep(2000);
        return loadOffering(attempt + 1);
      }
    } catch {
      if (attempt < 3) {
        await sleep(2000);
        return loadOffering(attempt + 1);
      }
    } finally {
      if (attempt >= 3) setOfferingLoading(false);
      else setOfferingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    setError('');
    retryCount.current = 0;

    const attemptPurchase = async (): Promise<void> => {
      const pkg: RCPackage | null = offering
        ? (plan === 'yearly' ? offering.yearly : offering.monthly)
        : null;

      try {
        if (pkg) {
          // Happy path — purchase via RC package
          const { purchasePackage } = await import('@/lib/revenuecat');
          const result = await purchasePackage(pkg);
          if (!result.success) {
            if (!result.cancelled) setError(result.error);
            return;
          }
        } else {
          // Fallback — try direct StoreKit product fetch
          const { RC_PRODUCT_MONTHLY, RC_PRODUCT_YEARLY } = await import('@/lib/revenuecat');
          const { Purchases } = await import('@revenuecat/purchases-capacitor');
          const productId = plan === 'yearly' ? RC_PRODUCT_YEARLY : RC_PRODUCT_MONTHLY;
          const result = await Purchases.getProducts({ productIdentifiers: [productId] });
          const productList = (result as unknown as { products: unknown[] }).products ?? [];

          if (productList.length === 0) {
            // Products not loaded yet — retry offering once more before giving up
            if (retryCount.current < 2) {
              retryCount.current++;
              await sleep(2000);
              const { getOffering } = await import('@/lib/revenuecat');
              const freshOffering = await getOffering();
              if (freshOffering.monthly || freshOffering.yearly) {
                setOffering(freshOffering);
              }
              return attemptPurchase();
            }
            setError('Subscription not available right now. Tap retry to try again.');
            return;
          }
          await Purchases.purchaseStoreProduct({ product: productList[0] as never });
        }

        // Verify and activate
        const res = await fetch('/api/iap/verify', { method: 'POST' });
        const json = await res.json() as { isPremium: boolean };
        if (json.isPremium) {
          onPremiumActivated();
        } else {
          setError('Purchase recorded — please restart the app to activate Premium.');
        }
      } catch (e) {
        const err = e as Record<string, unknown>;
        const isCancelled = err?.userCancelled === true;
        if (!isCancelled) {
          const msg = String(err?.message ?? '');
          // Never surface RC SDK internals to the user (e.g. "configuration" errors,
          // rev.cat links). Show a clean retry prompt instead.
          const isRCInternalError =
            msg.includes('rev.cat') ||
            msg.toLowerCase().includes('configuration') ||
            msg.toLowerCase().includes('underlying error') ||
            msg.toLowerCase().includes('purchases error');
          setError(
            isRCInternalError
              ? 'Subscription not available right now. Tap retry to try again.'
              : (msg || 'Purchase failed. Please try again.')
          );
        }
      }
    };

    await attemptPurchase();
    setPurchasing(false);
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
          <div className="mb-3 flex flex-col items-center gap-2">
            <p className="text-xs text-red-400 text-center">{error}</p>
            <button
              onClick={() => { setError(''); loadOffering(); }}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <RefreshCw size={11} />
              Tap to retry
            </button>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={purchasing || offeringLoading}
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
          Payment charged to your Apple ID at confirmation. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID Account Settings.{' '}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--text)] transition-colors"
          >
            Privacy Policy
          </a>
          {' · '}
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--text)] transition-colors"
          >
            Terms of Use
          </a>
        </p>
      </div>
    </div>
  );
}
