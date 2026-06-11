'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarDays, BookOpen, ShoppingCart, Settings } from 'lucide-react';

const navItems = [
  { href: '/home',     icon: LayoutDashboard, label: 'Today',    color: '#10B981' },
  { href: '/calendar', icon: CalendarDays,    label: 'Calendar', color: '#06B6D4' },
  { href: '/recipes',  icon: BookOpen,        label: 'Recipes',  color: '#8B5CF6' },
  { href: '/grocery',  icon: ShoppingCart,    label: 'Grocery',  color: '#F59E0B' },
  { href: '/settings', icon: Settings,        label: 'Settings', color: '#A855F7' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    navItems.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  return (
    <nav
      className="md:hidden border-t flex items-center justify-around px-1 pb-safe shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {navItems.map(({ href, icon: Icon, label, color }) => {
        const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className="flex flex-col items-center gap-1 py-2.5 px-1 min-w-0 flex-1"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200'
              )}
              style={active
                ? { background: color, boxShadow: `0 4px 14px ${color}44` }
                : {}}
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ color: active ? '#fff' : 'var(--text-muted)' }}
              />
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: active ? color : 'var(--text-muted)' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
