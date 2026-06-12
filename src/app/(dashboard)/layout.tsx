import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    /*
     * Fixed-height container covering the full viewport.
     * Only the <main> content area scrolls — the Sidebar and MobileNav
     * are static flex children so they never shift during iOS momentum scroll.
     */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Sidebar />

      {/* Column: scrollable content + bottom nav */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <main
          className="md:pb-0"
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          }}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* MobileNav sits at the bottom of the flex column — no position:fixed needed */}
        <MobileNav />
      </div>
    </div>
  );
}
