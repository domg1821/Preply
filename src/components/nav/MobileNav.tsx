'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarDays, BookOpen, ShoppingCart, Settings, Crown } from 'lucide-react';

const navItems = [
  { href: '/home', icon: LayoutDashboard, label: 'Today' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/grocery', icon: ShoppingCart, label: 'Grocery' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav({ isPremium }: { isPremium?: boolean | null }) {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] flex items-center justify-around px-1 pb-safe"
      style={{ background: 'linear-gradient(180deg, #161C26 0%, #131820 100%)' }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
        const isSettingsLink = href === '/settings';
        return (
          <Link key={href} href={href}
            className={cn(
              'flex flex-col items-center gap-1 py-3 px-2 min-w-0 flex-1 text-xs font-medium transition-colors duration-150',
              active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
            )}
          >
            <span className="relative">
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              {isSettingsLink && isPremium && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                  <Crown size={7} className="text-black" />
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
