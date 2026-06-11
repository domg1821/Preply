'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarDays, BookOpen, ShoppingCart, Settings } from 'lucide-react';

const navItems = [
  { href: '/home', icon: LayoutDashboard, label: 'Today' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/grocery', icon: ShoppingCart, label: 'Grocery' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    navItems.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] flex items-center justify-around px-1 pb-safe"
      style={{ background: 'linear-gradient(180deg, #161C26 0%, #131820 100%)' }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              'flex flex-col items-center gap-1 py-3 px-2 min-w-0 flex-1 text-xs font-medium',
              active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
