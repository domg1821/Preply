'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Plus, Flame, Beef, Wheat, ShoppingCart, BookOpen, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MacroRing } from '@/components/dashboard/MacroRing';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { MealPlanEntry, Profile } from '@/types';
import { calcRecipeMacros, getMondayOfWeek, getWeekDates, formatDate } from '@/lib/utils';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function WeekPlanCard({
  weekMeals,
  monday,
  today,
}: {
  weekMeals: MealPlanEntry[];
  monday: Date;
  today: string;
}) {
  const weekDates = getWeekDates(monday);
  const weekLabel = format(monday, 'MMM d');

  // Count unique (date, core-meal-type) slots that are filled
  const filledSlots = new Set(
    weekMeals
      .filter((e) => ['breakfast', 'lunch', 'dinner'].includes(e.meal_type))
      .map((e) => `${e.date}__${e.meal_type}`)
  ).size;
  const totalSlots = 21;
  const pct = Math.round((filledSlots / totalSlots) * 100);

  return (
    <div className="rounded-2xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text)]">This Week&apos;s Plan</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">Week of {weekLabel}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[var(--text-muted)]">{filledSlots} of {totalSlots} meal slots planned</span>
          <span className="text-[var(--text-muted)]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Day rows */}
      <div className="mb-4">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const dayMeals = weekMeals
            .filter((e) => e.date === dateStr)
            .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type as typeof MEAL_ORDER[number]) - MEAL_ORDER.indexOf(b.meal_type as typeof MEAL_ORDER[number]));
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className="flex items-start gap-3 py-1.5 border-b border-[var(--border)]/40 last:border-0"
            >
              <span className={`text-[11px] font-semibold shrink-0 w-7 mt-0.5 ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {DAY_LABELS_SHORT[i]}
              </span>
              {dayMeals.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)] opacity-40">—</span>
              ) : (
                <p className="text-xs text-[var(--text)] leading-relaxed flex-1 min-w-0">
                  {dayMeals.map((e, idx) => (
                    <span key={e.id}>
                      {idx > 0 && <span className="text-[var(--text-muted)]">, </span>}
                      <span className="font-medium">{e.recipe?.name ?? 'Unknown'}</span>
                      <span className="text-[var(--text-muted)]"> ({MEAL_LABELS[e.meal_type]})</span>
                    </span>
                  ))}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link
          href="/calendar"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          <CalendarDays size={13} />
          View Calendar
        </Link>
        <Link
          href="/grocery"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-2)] transition-colors"
          style={{ background: 'var(--surface-2)' }}
        >
          <ShoppingCart size={13} />
          Build Grocery List
        </Link>
      </div>
    </div>
  );
}
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-amber-400 bg-amber-500/10',
  lunch: 'text-[var(--primary)] bg-emerald-500/10',
  dinner: 'text-purple-400 bg-purple-500/10',
  snack: 'text-blue-400 bg-blue-500/10',
};

const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HomePage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM d');
  const monday = getMondayOfWeek(new Date());
  const weekStartStr = formatDate(monday);
  const weekEndStr = formatDate(getWeekDates(monday)[6]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<MealPlanEntry[]>([]);
  const [weekMeals, setWeekMeals] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [profileRes, mealsRes, weekMealsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch(`/api/meal-plans?week_start=${today}&week_end=${today}`),
      fetch(`/api/meal-plans?week_start=${weekStartStr}&week_end=${weekEndStr}`),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      if (!profileRes.data.onboarding_completed) {
        setShowOnboarding(true);
      }
    }

    if (mealsRes.ok) {
      const data = await mealsRes.json();
      setMeals(data ?? []);
    }

    if (weekMealsRes.ok) {
      const data = await weekMealsRes.json();
      setWeekMeals(data ?? []);
    }

    setLoading(false);
  }, [today, weekStartStr, weekEndStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Calculate today's macro totals
  const totalMacros = meals.reduce(
    (acc, entry) => {
      if (!entry.recipe) return acc;
      const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goals = profile?.macro_goals ?? { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const mealsByType = MEAL_ORDER.reduce<Record<string, MealPlanEntry[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.meal_type === type);
    return acc;
  }, {} as Record<string, MealPlanEntry[]>);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        <div className="h-40 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        <div className="h-48 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          userName={profile?.full_name}
          onComplete={() => {
            setShowOnboarding(false);
            fetchData();
          }}
        />
      )}

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">
              {firstName ? `Hey, ${firstName} 👋` : 'Today'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
              <CalendarDays size={13} />
              {displayDate}
            </p>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
          >
            Week view
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Macro rings */}
        <div className="rounded-2xl border border-[var(--border)] p-4"
          style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-[var(--text)]">Nutrition Today</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {Math.round(totalMacros.calories)} / {goals.calories} kcal
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MacroRing
              value={totalMacros.calories}
              goal={goals.calories}
              color="#F59E0B"
              label="Calories"
              unit="kcal"
              size={82}
              strokeWidth={6}
            />
            <MacroRing
              value={totalMacros.protein}
              goal={goals.protein ?? 150}
              color="#10B981"
              label="Protein"
              unit="g"
              size={82}
              strokeWidth={6}
            />
            <MacroRing
              value={totalMacros.carbs}
              goal={goals.carbs ?? 200}
              color="#60A5FA"
              label="Carbs"
              unit="g"
              size={82}
              strokeWidth={6}
            />
            <MacroRing
              value={totalMacros.fat}
              goal={goals.fat ?? 65}
              color="#A78BFA"
              label="Fat"
              unit="g"
              size={82}
              strokeWidth={6}
            />
          </div>

          {/* Calorie progress bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-[var(--border-2)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((totalMacros.calories / goals.calories) * 100, 100)}%`,
                  background: totalMacros.calories > goals.calories
                    ? '#EF4444'
                    : 'linear-gradient(90deg, #10B981, #F59E0B)',
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1">
              <span>{Math.round(goals.calories - totalMacros.calories > 0 ? goals.calories - totalMacros.calories : 0)} kcal remaining</span>
              <span>{Math.round((totalMacros.calories / goals.calories) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Today's meals */}
        <div className="rounded-2xl border border-[var(--border)] p-4"
          style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text)]">Meals Today</span>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
            >
              <Plus size={13} />
              Add meal
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-center">
              <p className="text-sm text-[var(--text-muted)]">Nothing planned yet.</p>
              <Link
                href="/calendar"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Open calendar to add meals →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {MEAL_ORDER.map((type) => {
                const typeMeals = mealsByType[type];
                if (typeMeals.length === 0) return null;
                return (
                  <div key={type}>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1 ${MEAL_COLORS[type]}`}>
                      {MEAL_LABELS[type]}
                    </div>
                    {typeMeals.map((entry) => {
                      const m = entry.recipe ? calcRecipeMacros(entry.recipe.ingredients, entry.servings) : null;
                      return (
                        <div key={entry.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl mb-1"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text)] truncate">
                              {entry.recipe?.name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {m && (
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1">
                                <Flame size={11} className="text-amber-400" />
                                <span className="text-xs font-semibold text-[var(--text)]">{Math.round(m.calories)}</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1">
                                <Beef size={11} className="text-[var(--primary)]" />
                                <span className="text-xs text-[var(--text-muted)]">{Math.round(m.protein)}g</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1">
                                <Wheat size={11} className="text-blue-400" />
                                <span className="text-xs text-[var(--text-muted)]">{Math.round(m.carbs)}g</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* This week's plan */}
        <WeekPlanCard weekMeals={weekMeals} monday={monday} today={today} />

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/calendar', label: 'Plan This Week', desc: 'Add meals to your calendar', color: 'text-[var(--primary)]', bg: 'bg-emerald-500/10', Icon: CalendarDays },
            { href: '/grocery', label: 'Grocery List', desc: 'See what you need to buy', color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: ShoppingCart },
            { href: '/recipes', label: 'My Recipes', desc: 'Browse & build recipes', color: 'text-blue-400', bg: 'bg-blue-500/10', Icon: BookOpen },
            { href: '/macros', label: 'Weekly Report', desc: 'Track your progress', color: 'text-purple-400', bg: 'bg-purple-500/10', Icon: BarChart3 },
          ].map(({ href, label, desc, color, bg, Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-[var(--border)] p-4 flex flex-col gap-1.5 hover:border-[var(--border-2)] transition-all duration-200 group"
              style={{ background: 'var(--surface)' }}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon size={14} className={color} />
              </div>
              <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{label}</p>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
