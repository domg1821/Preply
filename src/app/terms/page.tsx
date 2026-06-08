import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export const metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-50 flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]"
        style={{ background: 'rgba(14,17,23,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: '#10B981' }}>Preply</span>
        </Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Terms of Use</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: June 2026</p>
        <div className="space-y-8 text-[var(--text-dim)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">By downloading or using Preply, you agree to these Terms of Use. If you do not agree, do not use the app.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">2. Subscriptions</h2>
            <p className="leading-relaxed">Preply Premium is available as a monthly subscription ($4.99/month) or annual subscription ($41.99/year). Payment is charged to your Apple ID at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel your subscription in your Apple ID Account Settings. No refunds are provided for partial subscription periods.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">3. Free Plan</h2>
            <p className="leading-relaxed">A free tier is available with core meal planning features. Premium features require an active subscription.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">4. User Content</h2>
            <p className="leading-relaxed">You retain ownership of the recipes, meal plans, and content you create in the app. By using the app you grant us a limited license to store and process your content to provide the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">5. Prohibited Use</h2>
            <p className="leading-relaxed">You may not use Preply for any unlawful purpose, attempt to reverse-engineer the app, or use it in any way that could harm other users or the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">6. Disclaimer</h2>
            <p className="leading-relaxed">Preply is provided as-is without warranties of any kind. Nutritional and meal information is for general guidance only and is not medical advice. Consult a healthcare professional for dietary needs.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">7. Account Termination</h2>
            <p className="leading-relaxed">You may delete your account at any time from Settings. We reserve the right to terminate accounts that violate these terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">8. Contact</h2>
            <p className="leading-relaxed">For questions about these terms, contact us at <a href="mailto:domgbp21@gmail.com" className="text-[#10B981] hover:underline">domgbp21@gmail.com</a>.</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} Preply · <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
