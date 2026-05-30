'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ShoppingCart, Check, ChefHat } from 'lucide-react';

interface IngredientItem { name: string; amount: number; unit: string; }
interface MealGroup {
  meal_plan_id: string;
  recipe_name: string;
  meal_type: string;
  date: string;
  ingredients: IngredientItem[];
}

const MEAL_EMOJI: Record<string, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' };

function formatAmt(n: number) {
  if (n % 1 === 0) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

function formatWeekLabel(weekStart: string) {
  const [y, m, d] = weekStart.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  const sunday = new Date(y, m - 1, d + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
}

function getDayLabel(dateStr: string, mealType: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${date.toLocaleDateString('en-US', { weekday: 'short' })} – ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
}

export default function SharedGroceryPage({ params }: { params: Promise<{ userId: string; weekStart: string }> }) {
  const { userId, weekStart } = use(params);

  const [mealGroups, setMealGroups] = useState<MealGroup[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const week = weekStart ?? '';

  useEffect(() => {
    if (!userId || !weekStart) {
      setError('Invalid share link.');
      setLoading(false);
      return;
    }

    fetch(`/api/grocery/public?user_id=${userId}&week_start=${weekStart}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setMealGroups(data.mealGroups ?? []);
        setCheckedKeys(new Set(data.checkedItems ?? []));
      })
      .catch(() => setError('Failed to load grocery list.'))
      .finally(() => setLoading(false));
  }, [userId, weekStart]);

  // Local-only check (doesn't persist — shared view is read-ish)
  function toggleItem(meal_plan_id: string, ingredient_name: string) {
    const key = `${meal_plan_id}__${ingredient_name}`;
    setCheckedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const totalItems = mealGroups.reduce((acc, g) => acc + g.ingredients.length, 0);
  const checkedCount = checkedKeys.size;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #0F1318)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #161C26 0%, #131820 100%)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <ChefHat size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Shared Grocery List</p>
              {week && <p className="text-[10px] text-white/50">{formatWeekLabel(week)}</p>}
            </div>
          </div>
          {!loading && !error && (
            <span className="text-xs text-white/60">
              {checkedCount}/{totalItems} checked
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#1a1f2e' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <ShoppingCart size={36} className="text-white/20" />
            <p className="text-white/50 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && mealGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <ShoppingCart size={36} className="text-white/20" />
            <p className="text-white/50 text-sm">No meals planned for this week.</p>
          </div>
        )}

        {!loading && !error && mealGroups.length > 0 && (
          <div className="flex flex-col gap-3">
            {mealGroups.map((group) => {
              const emoji = MEAL_EMOJI[group.meal_type] ?? '🍽️';
              const total = group.ingredients.length;
              const checked = group.ingredients.filter(i => checkedKeys.has(`${group.meal_plan_id}__${i.name}`)).length;

              return (
                <div key={group.meal_plan_id} className="rounded-2xl overflow-hidden border border-white/8"
                  style={{ background: '#1a1f2e' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{group.recipe_name}</p>
                        <p className="text-[11px] text-white/40">{getDayLabel(group.date, group.meal_type)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      checked === total ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {checked}/{total}
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.ingredients.map((ing) => {
                      const key = `${group.meal_plan_id}__${ing.name}`;
                      const isChecked = checkedKeys.has(key);
                      return (
                        <button key={ing.name} onClick={() => toggleItem(group.meal_plan_id, ing.name)}
                          className={`w-full flex items-center gap-3 px-4 text-left transition-colors hover:bg-white/5 ${isChecked ? 'opacity-40' : ''}`}
                          style={{ minHeight: '44px' }}>
                          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                          }`}>
                            {isChecked && <Check size={10} className="text-white" />}
                          </span>
                          <span className={`flex-1 text-sm ${isChecked ? 'line-through text-white/30' : 'text-white/80'}`}>
                            {ing.name}
                            <span className="text-white/30 ml-1.5">— {formatAmt(ing.amount)} {ing.unit}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] text-white/20 mt-8">
          Shared via <span className="font-semibold">Preply</span> · Meal Planner
        </p>
      </div>
    </div>
  );
}
