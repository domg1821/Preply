export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Last updated: May 31, 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>Information We Collect</h2>
      <p>When you create an account, we collect your name and email address. We use this information solely to provide and improve the Preply meal planning service.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>How We Use Your Information</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li>To create and manage your account</li>
        <li>To save your meal plans, recipes, and grocery lists</li>
        <li>To process subscription payments via Stripe</li>
        <li>To send important account notifications</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>Data Storage</h2>
      <p>Your data is stored securely using Supabase. We do not sell or share your personal information with third parties for marketing purposes.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>Payments</h2>
      <p>Payment processing is handled by Stripe. We do not store your credit card information. Stripe's privacy policy applies to all payment transactions.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>Your Rights</h2>
      <p>You may request deletion of your account and all associated data at any time by contacting us at domgbp21@gmail.com.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>Contact</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:domgbp21@gmail.com" style={{ color: '#10B981' }}>domgbp21@gmail.com</a>.</p>
    </div>
  );
}
