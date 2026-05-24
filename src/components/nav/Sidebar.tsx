'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  BarChart3,
  Settings,
  ChefHat,
  Crown,
} from 'lucide-react';

const navItems = [
  { href: '/home', icon: LayoutDashboard, label: 'Today' },
  { href: '/calendar', icon: CalendarDays, label: 'Meal Calendar' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/grocery', icon: ShoppingCart, label: 'Grocery List' },
  { href: '/macros', icon: BarChart3, label: 'Macros' },
];

export function Sidebar({ isPremium }: { isPremium?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen shrink-0 border-r border-[var(--border)]"
      style={{ background: 'linear-gradient(180deg, #161C26 0%, #131820 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-primary"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <ChefHat size={17} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight gradient-text">Preply</span>
          <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">Meal Planner</p>
        </div>
      </div>

      <div className="px-3 mb-2">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-2 mb-1">Menu</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
              } : {}}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--primary)]" />
              )}
              <Icon size={17} className={active ? 'text-[var(--primary)]' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-[var(--border)] pt-4 mx-3 mt-3">
        {!isPremium && (
          <div className="rounded-xl p-3 mb-2"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Go Premium</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-2 leading-relaxed">AI suggestions, barcode scanner & more</p>
            <Link
              href="/settings"
              className="block w-full text-center text-xs font-semibold rounded-lg py-1.5 transition-colors"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000' }}
            >
              Upgrade
            </Link>
          </div>
        )}
        <Link
          href="/settings"
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            pathname.startsWith('/settings')
              ? 'text-white'
              : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          )}
          style={pathname.startsWith('/settings') ? {
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
          } : {}}
        >
          {pathname.startsWith('/settings') && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--primary)]" />
          )}
          <Settings size={17} className={pathname.startsWith('/settings') ? 'text-[var(--primary)]' : ''} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
