import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Always re-fetch on every navigation so is_premium is never stale
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar isPremium={profile?.is_premium} />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <MobileNav isPremium={profile?.is_premium} />
    </div>
  );
}
