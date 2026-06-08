import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: June 2026</p>
        <div className="space-y-8 text-[var(--text-dim)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed">We collect your email address and password when you create an account, and the meal plans, recipes, and grocery lists you create in the app. We also collect basic usage data to improve the app.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed">We use your information to provide the Preply service, process subscription payments, send transactional emails such as password resets, and respond to support requests. We do not sell your personal information.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">3. In-App Purchases</h2>
            <p className="leading-relaxed">Premium subscriptions purchased through the iOS app are processed by Apple. We do not store your payment card information. Subscription management is handled through your Apple ID Account Settings.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">4. Data Storage</h2>
            <p className="leading-relaxed">Your data is stored securely using Supabase on AWS infrastructure with industry-standard encryption in transit and at rest.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">5. Data Deletion</h2>
            <p className="leading-relaxed">You can delete your account and all associated data at any time from Settings in the app. Deletion is permanent and cannot be undone.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">6. Contact</h2>
            <p className="leading-relaxed">For privacy questions, contact us at <a href="mailto:domgbp21@gmail.com" className="text-[#10B981] hover:underline">domgbp21@gmail.com</a>.</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} Preply · <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
      </footer>
    </div>
  );
}
