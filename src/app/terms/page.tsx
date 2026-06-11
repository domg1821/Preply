import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export const metadata = { title: 'Terms of Use' };

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Terms of Use</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: June 2026</p>

        <div className="space-y-8" style={{ color: 'var(--text-dim)' }}>
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">By using Preply, you agree to these Terms of Use. If you do not agree, please do not use the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">2. Free Service</h2>
            <p className="leading-relaxed">Preply is completely free to use. All features — meal planning, recipe management, grocery lists, macro tracking, and event menus — are available to all users at no cost. There are no subscriptions, premium tiers, or in-app purchases.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">3. User Accounts</h2>
            <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account or use another person's account without permission. You must provide accurate information when creating your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">4. User Content</h2>
            <p className="leading-relaxed">You retain ownership of the recipes, meal plans, and other content you create in Preply. By using the service, you grant us a limited license to store and display your content solely to provide the service to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">5. Acceptable Use</h2>
            <p className="leading-relaxed">You agree not to use Preply in any way that violates applicable laws, infringes on the rights of others, or interferes with the normal operation of the service. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">6. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">Preply is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that any nutritional information provided is medically accurate. Consult a healthcare professional for personalized nutrition advice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">7. Limitation of Liability</h2>
            <p className="leading-relaxed">To the maximum extent permitted by law, Preply and its developers are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">8. Changes to Terms</h2>
            <p className="leading-relaxed">We may update these terms from time to time. Continued use of Preply after changes are posted constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">9. Contact</h2>
            <p className="leading-relaxed">For questions about these terms, contact us at <a href="mailto:domgbp21@gmail.com" className="hover:underline" style={{ color: '#10B981' }}>domgbp21@gmail.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Preply ·{' '}
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
