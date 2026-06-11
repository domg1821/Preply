import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-50 flex items-center gap-3 px-6 py-4 border-b"
        style={{ background: 'rgba(7,9,14,0.95)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}>
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Preply</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Privacy Policy</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: June 2026</p>

        <div className="space-y-8" style={{ color: 'var(--text-dim)' }}>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed">We collect your email address and password when you create an account, and the meal plans, recipes, grocery lists, and nutrition logs you create in the app. We also collect basic usage data to improve the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed">We use your information solely to provide and improve the Preply service — including syncing your data across devices, sending transactional emails such as password resets, and responding to support requests. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">3. Payments</h2>
            <p className="leading-relaxed">Preply is free to use and does not currently offer in-app purchases or paid subscriptions. We do not collect or store any payment information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">4. Data Storage</h2>
            <p className="leading-relaxed">Your data is stored securely using Supabase on AWS infrastructure with industry-standard encryption in transit and at rest.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">5. Data Deletion</h2>
            <p className="leading-relaxed">You can delete your account and all associated data at any time from the Settings screen in the app. Deletion is permanent and cannot be undone.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">6. Third-Party Services</h2>
            <p className="leading-relaxed">We use Supabase for authentication and data storage. Their privacy practices are governed by the <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#10B981' }}>Supabase Privacy Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">7. Contact</h2>
            <p className="leading-relaxed">For privacy questions, contact us at <a href="mailto:domgbp21@gmail.com" className="hover:underline" style={{ color: '#10B981' }}>domgbp21@gmail.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Preply ·{' '}
        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
      </footer>
    </div>
  );
}
