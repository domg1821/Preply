'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MealPlanEntry } from '@/types';
import { calcRecipeMacros, formatDate, getMondayOfWeek, getWeekDates } from '@/lib/utils';

interface DayData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MacrosPage() {
  const [weekStart] = useState(() => getMondayOfWeek(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  const weekDates = getWeekDates(weekStart);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const weekEnd = weekDates[6];
    const res = await fetch(`/api/meal-plans?week_start=${formatDate(weekStart)}&week_end=${formatDate(weekEnd)}`);
    const data = await res.json();
    setEntries(data ?? []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dayData: DayData[] = weekDates.map((date) => {
    const dateStr = formatDate(date);
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const totals = dayEntries.reduce(
      (acc, e) => {
        if (!e.recipe) return acc;
        const m = calcRecipeMacros(e.recipe.ingredients, e.servings);
        return { calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return { day: format(date, 'EEE'), ...totals };
  });

  const weekTotals = dayData.reduce(
    (acc, d) => ({ calories: acc.calories + d.calories, protein: acc.protein + d.protein, carbs: acc.carbs + d.carbs, fat: acc.fat + d.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const avgCalories = weekTotals.calories / 7;

  const METRICS = [
    { key: 'calories' as const, label: 'Calories', unit: 'kcal', color: '#F59E0B' },
    { key: 'protein' as const, label: 'Protein', unit: 'g', color: '#10B981' },
    { key: 'carbs' as const, label: 'Carbs', unit: 'g', color: '#60A5FA' },
    { key: 'fat' as const, label: 'Fat', unit: 'g', color: '#A78BFA' },
  ];

  const active = METRICS.find((m) => m.key === activeMetric)!;

  // Per-meal breakdown for today
  const todayStr = formatDate(new Date());
  const todayEntries = entries.filter((e) => e.date === todayStr);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Macros</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {format(weekStart, 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {METRICS.map(({ key, label, unit, color }) => {
          const val = key === 'calories' ? Math.round(weekTotals[key]) : Math.round(weekTotals[key] * 10) / 10;
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                activeMetric === key
                  ? 'border-[var(--border-2)] bg-[var(--surface-2)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-2)]'
              }`}
            >
              <p className="text-xs text-[var(--text-muted)] mb-1">{label} (week)</p>
              <p className="text-xl font-bold" style={{ color }}>
                {val}
                <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">{unit}</span>
              </p>
              {key === 'calories' && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{Math.round(avgCalories)} avg/day</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
          {active.label} per day ({active.unit})
        </h2>
        {loading ? (
          <div className="h-48 animate-pulse bg-[var(--surface-2)] rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
                itemStyle={{ color: active.color }}
                formatter={(v) => [`${Math.round(Number(v) * 10) / 10} ${active.unit}`, active.label]}
              />
              <Bar dataKey={activeMetric} radius={[6, 6, 0, 0]}>
                {dayData.map((_, i) => (
                  <Cell key={i} fill={i === new Date().getDay() - 1 ? active.color : `${active.color}60`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Today's breakdown */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Today&apos;s meals</h2>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No meals planned for today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayEntries.map((entry) => {
              if (!entry.recipe) return null;
              const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
              return (
                <div key={entry.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{entry.recipe.name}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{entry.meal_type} · {entry.servings}x serving</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { label: 'Cal', val: Math.round(m.calories), color: 'text-amber-400' },
                      { label: 'Pro', val: `${Math.round(m.protein)}g`, color: 'text-[var(--primary)]' },
                      { label: 'Carb', val: `${Math.round(m.carbs)}g`, color: 'text-blue-400' },
                      { label: 'Fat', val: `${Math.round(m.fat)}g`, color: 'text-purple-400' },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <p className={`text-sm font-semibold ${color}`}>{val}</p>
                        <p className="text-xs text-[var(--text-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
