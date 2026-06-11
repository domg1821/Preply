'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Flame, Beef, Wheat, Droplets, Target, BarChart3, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MacroRing } from '@/components/dashboard/MacroRing';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { MealPlanEntry, Profile, DailyLog } from '@/types';
import { calcRecipeMacros, formatDate } from '@/lib/utils';

const MACROS = [
  { key: 'calories', label: 'Calories', unit: '',  color: '#F59E0B', Icon: Flame,    goalKey: 'calories' },
  { key: 'protein',  label: 'Protein',  unit: 'g', color: '#10B981', Icon: Beef,     goalKey: 'protein'  },
  { key: 'carbs',    label: 'Carbs',    unit: 'g', color: '#06B6D4', Icon: Wheat,    goalKey: 'carbs'    },
  { key: 'fat',      label: 'Fat',      unit: 'g', color: '#8B5CF6', Icon: Droplets, goalKey: 'fat'      },
] as const;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MacrosPage() {
  const today       = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM d');

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [meals,    setMeals]    = useState<MealPlanEntry[]>([]);
  const [weekData, setWeekData] = useState<Array<{ date: string; calories: number }>>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading,  setLoading]  = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Build 7-day range (last 7 days including today)
    const weekEnd   = today;
    const weekStart = formatDate(subDays(new Date(), 6));

    const [profileRes, todayMealsRes, weekMealsRes, logRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch(`/api/meal-plans?week_start=${today}&week_end=${today}`),
      fetch(`/api/meal-plans?week_start=${weekStart}&week_end=${weekEnd}`),
      fetch(`/api/daily-logs?date=${today}`),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (todayMealsRes.ok) setMeals((await todayMealsRes.json()) ?? []);
    if (logRes.ok) {
      const d = await logRes.json();
      setDailyLog(Array.isArray(d) ? (d[0] ?? null) : d);
    }

    if (weekMealsRes.ok) {
      const weekMeals: MealPlanEntry[] = (await weekMealsRes.json()) ?? [];
      const byDate: Record<string, number> = {};
      weekMeals.forEach(e => {
        if (!e.recipe) return;
        const m = calcRecipeMacros(e.recipe.ingredients, e.servings);
        byDate[e.date] = (byDate[e.date] ?? 0) + m.calories;
      });
      // Build 7-entry array (last 7 days)
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = formatDate(subDays(new Date(), i));
        result.push({ date: d, calories: Math.round(byDate[d] ?? 0) });
      }
      setWeekData(result);
    }

    setLoading(false);
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleWaterUpdate(glasses: number) {
    setDailyLog(prev => prev ? { ...prev, water_glasses: glasses } : { date: today, water_glasses: glasses });
    await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, water_glasses: glasses }),
    });
  }

  const goals  = profile?.macro_goals;
  const totals = meals.reduce((acc, e) => {
    if (!e.recipe) return acc;
    const m = calcRecipeMacros(e.recipe.ingredients, e.servings);
    return { calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const maxWeekCal = Math.max(...weekData.map(d => d.calories), goals?.calories ?? 0, 1);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3">
        {[80, 200, 150, 130].map((h, i) => <div key={i} className="rounded-2xl shimmer" style={{ height: h }} />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in space-y-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <BarChart3 size={16} style={{ color: '#EC4899' }} />
          <h1 className="text-2xl font-bold text-[var(--text)]">Nutrition</h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{displayDate}</p>
      </div>

      {/* ── Macro rings ────────────────────────────────────── */}
      {goals ? (
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[var(--text)]">Daily Progress</p>
            <Link href="/settings" className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Edit goals →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            {MACROS.map(({ key, label, unit, color, goalKey }) => (
              <MacroRing
                key={key}
                value={totals[key as keyof typeof totals]}
                goal={goals[goalKey as keyof typeof goals] as number ?? 0}
                color={color}
                label={label}
                unit={unit || 'kcal'}
                size={80}
                strokeWidth={6}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.15)' }}>
            <Target size={20} style={{ color: '#EC4899' }} />
          </div>
          <div>
            <p className="font-bold text-[var(--text)]">No goals set yet</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Set your daily macro goals to track progress</p>
          </div>
          <Link
            href="/settings"
            className="text-xs font-bold text-white px-5 py-2.5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', boxShadow: '0 4px 16px rgba(236,72,153,0.3)' }}
          >
            Set Goals →
          </Link>
        </div>
      )}

      {/* ── Today's breakdown ──────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold text-[var(--text)] mb-4">Today&apos;s Breakdown</p>
        {meals.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 text-center">
            <Sparkles size={20} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No meals logged today</p>
            <Link href="/calendar" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Add meals →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {MACROS.map(({ key, label, unit, color, Icon, goalKey }) => {
              const val  = Math.round(totals[key as keyof typeof totals]);
              const goal = goals?.[goalKey as keyof typeof goals] as number | undefined;
              const pct  = goal ? Math.min((val / goal) * 100, 100) : null;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--text)]">{label}</span>
                      <span className="text-xs font-bold" style={{ color }}>
                        {val}{unit}
                        {goal ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {goal}{unit}</span> : ''}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: pct !== null ? `${pct}%` : '0%', background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Weekly calorie chart ────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} style={{ color: '#06B6D4' }} />
          <p className="text-sm font-bold text-[var(--text)]">Last 7 Days</p>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Calories</span>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {weekData.map(({ date, calories }, i) => {
            const isToday = date === today;
            const pct     = maxWeekCal > 0 ? (calories / maxWeekCal) * 100 : 0;
            const dayLabel = DAY_LABELS[new Date(date + 'T00:00:00').getDay() === 0 ? 6 : new Date(date + 'T00:00:00').getDay() - 1];
            return (
              <div key={date} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex items-end" style={{ height: 72 }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(pct, calories > 0 ? 6 : 0)}%`,
                      background: isToday
                        ? 'linear-gradient(180deg, #06B6D4, #0891B2)'
                        : calories > 0
                        ? 'linear-gradient(180deg, rgba(6,182,212,0.5), rgba(6,182,212,0.2))'
                        : 'var(--surface-2)',
                      boxShadow: isToday ? '0 -2px 8px rgba(6,182,212,0.4)' : 'none',
                    }}
                  />
                </div>
                <span
                  className="text-[9px] font-semibold"
                  style={{ color: isToday ? '#06B6D4' : 'var(--text-muted)' }}
                >
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
        {goals?.calories && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Goal: {goals.calories} cal/day</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Avg: {weekData.length ? Math.round(weekData.reduce((s, d) => s + d.calories, 0) / weekData.filter(d => d.calories > 0).length || 1) : 0} cal
            </span>
          </div>
        )}
      </div>

      {/* ── Water tracker ──────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <WaterTracker glasses={dailyLog?.water_glasses ?? 0} onSet={handleWaterUpdate} />
      </div>

    </div>
  );
}
