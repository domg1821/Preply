'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, CalendarDays, BookOpen, ShoppingCart,
  Settings, ChefHat, PartyPopper, BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/home',     icon: LayoutDashboard, label: 'Today',     color: '#10B981', glow: 'rgba(16,185,129,0.18)'  },
  { href: '/calendar', icon: CalendarDays,    label: 'Calendar',  color: '#06B6D4', glow: 'rgba(6,182,212,0.18)'   },
  { href: '/recipes',  icon: BookOpen,        label: 'Recipes',   color: '#8B5CF6', glow: 'rgba(139,92,246,0.18)'  },
  { href: '/grocery',  icon: ShoppingCart,    label: 'Grocery',   color: '#F59E0B', glow: 'rgba(245,158,11,0.18)'  },
  { href: '/macros',   icon: BarChart3,       label: 'Nutrition', color: '#EC4899', glow: 'rgba(236,72,153,0.18)'  },
  { href: '/events',   icon: PartyPopper,     label: 'Events',    color: '#A855F7', glow: 'rgba(168,85,247,0.18)'  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen shrink-0 border-r"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #10B981, #06B6D4)',
            boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          }}
        >
          <ChefHat size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[17px] font-bold leading-tight gradient-text">Preply</div>
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Meal Planner
          </p>
        </div>
      </div>

      <div className="px-5 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map(({ href, icon: Icon, label, color, glow }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200',
                active ? 'text-white' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.03]'
              )}
              style={active
                ? { background: `linear-gradient(135deg, ${glow}, rgba(0,0,0,0))`, boxShadow: `0 2px 16px ${glow}` }
                : {}}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                style={active
                  ? { background: color, boxShadow: `0 4px 12px ${glow}` }
                  : { background: 'rgba(255,255,255,0.04)' }}
              >
                <Icon size={15} style={{ color: active ? '#fff' : 'var(--text-muted)' }} />
              </div>
              <span className="flex-1">{label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        {(() => {
          const active = pathname.startsWith('/settings');
          return (
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200',
                active ? 'text-white' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.03]'
              )}
              style={active
                ? { background: 'rgba(139,92,246,0.14)', boxShadow: '0 2px 16px rgba(139,92,246,0.14)' }
                : {}}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={active
                  ? { background: '#8B5CF6', boxShadow: '0 4px 12px rgba(139,92,246,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)' }}
              >
                <Settings size={15} style={{ color: active ? '#fff' : 'var(--text-muted)' }} />
              </div>
              <span className="flex-1">Settings</span>
              {active && <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#8B5CF6]" />}
            </Link>
          );
        })()}
      </div>
    </aside>
  );
}
