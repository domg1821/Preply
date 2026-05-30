'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Settings,
  ChefHat,
  Crown,
  PartyPopper,
} from 'lucide-react';

const navItems = [
  { href: '/home', icon: LayoutDashboard, label: 'Today' },
  { href: '/calendar', icon: CalendarDays, label: 'Meal Calendar' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/grocery', icon: ShoppingCart, label: 'Grocery List' },
  { href: '/events', icon: PartyPopper, label: 'Event Menus' },
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
        {isPremium ? (
          <div className="rounded-xl p-3 mb-2 flex items-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <Crown size={13} className="text-black" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-400 leading-none">Premium</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 opacity-70">All features unlocked ✓</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-3 mb-2 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={12} className="text-amber-400" />
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Go Premium</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1 leading-relaxed font-medium">
              AI meal plans in 60 seconds
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mb-2.5 opacity-70">
              From $3.50/mo · Cancel anytime
            </p>
            <Link
              href="/settings"
              className="block w-full text-center text-xs font-bold rounded-lg py-1.5 transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000' }}
            >
              Upgrade — 7-day guarantee ✓
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
          <span className="relative">
            <Settings size={17} className={pathname.startsWith('/settings') ? 'text-[var(--primary)]' : ''} />
            {isPremium && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                <Crown size={7} className="text-black" />
              </span>
            )}
          </span>
          Settings
        </Link>
      </div>
    </aside>
  );
}
