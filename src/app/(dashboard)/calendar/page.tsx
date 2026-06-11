'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart, BookOpen, Database, Sparkles, Check, CalendarDays, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MealSlot } from '@/components/calendar/MealSlot';
import { Badge } from '@/components/ui/Badge';
import { MealPlanEntry, MealType, Recipe, FoodItem } from '@/types';
import { formatDate, getMondayOfWeek, getWeekDates, roundMacro, calcRecipeMacros } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface SuggestionItem {
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id: string;
  recipe_name: string;
  servings: number;
}

const SUGGEST_MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};
const SUGGEST_MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-amber-400 bg-amber-500/10',
  lunch: 'text-emerald-400 bg-emerald-500/10',
  dinner: 'text-purple-400 bg-purple-500/10',
};
const SUGGEST_MEAL_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2 };

export default function CalendarPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<{ date: string; mealType: MealType } | null>(null);
  const [detailEntry, setDetailEntry] = useState<MealPlanEntry | null>(null);
  const [generatingGrocery, setGeneratingGrocery] = useState(false);
  const [grocerySuccess, setGrocerySuccess] = useState(false);
  const [groceryToast, setGroceryToast] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [calView, setCalView] = useState<'week' | 'month'>('week');

  const weekDates = getWeekDates(weekStart);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const weekEnd = getWeekDates(weekStart)[6];
    const [entriesRes, recipesRes] = await Promise.all([
      fetch(`/api/meal-plans?week_start=${formatDate(weekStart)}&week_end=${formatDate(weekEnd)}`),
      fetch('/api/recipes'),
    ]);
    const [entriesData, recipesData] = await Promise.all([entriesRes.json(), recipesRes.json()]);
    setEntries(entriesData ?? []);
    setRecipes(recipesData ?? []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  }
  function nextWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  }

  function getEntry(date: string, mealType: MealType) {
    return entries.find((e) => e.date === date && e.meal_type === mealType);
  }

  // Pushes a recipe's ingredients (or the recipe name as fallback) to the grocery list.
  // Returns the number of items added so we can show a toast.
  async function pushToGrocery(recipe: Recipe, servings: number): Promise<number> {
    const ings = recipe.ingredients ?? [];
    const items = ings.length > 0
      ? ings.map((ing) => ({
          name: ing.name,
          amount: Math.round(ing.amount_per_serving * servings * 100) / 100,
          unit: ing.unit,
          source_recipe: recipe.name,
        }))
      : [{ name: recipe.name, amount: servings, unit: 'serving', source_recipe: recipe.name }];

    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return items.length;
  }

  function showGroceryToast(count: number, recipeName: string) {
    setGroceryToast(`${count} ingredient${count !== 1 ? 's' : ''} from "${recipeName}" added to grocery list`);
    setTimeout(() => setGroceryToast(null), 4000);
  }

  async function handleAdd(recipe: Recipe, servings: number) {
    if (!addModal) return;
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: addModal.date, meal_type: addModal.mealType, recipe_id: recipe.id, servings }),
    });
    const newEntry = await res.json();
    setEntries((prev) => [...prev, newEntry]);
    setAddModal(null);
    // Auto-add ingredients to grocery list
    const count = await pushToGrocery(recipe, servings);
    showGroceryToast(count, recipe.name);
  }

  async function handleRemove(id: string) {
    await fetch(`/api/meal-plans?id=${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleServingChange(id: string, servings: number) {
    await fetch('/api/meal-plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, servings }),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, servings } : e)));
  }

  async function generateGroceryList() {
    setGeneratingGrocery(true);
    const weekStartStr = formatDate(weekStart);
    // Clear existing checks for the week so the new sync is fresh
    await fetch(`/api/grocery?clear_week=${weekStartStr}`, { method: 'DELETE' });
    // Navigate to grocery page with the week param — the page will load from meal_plans directly
    setGeneratingGrocery(false);
    setGrocerySuccess(true);
    setTimeout(() => {
      setGrocerySuccess(false);
      router.push(`/grocery?week_start=${weekStartStr}`);
    }, 600);
  }

  async function handleApplySuggestions(suggestions: SuggestionItem[]) {
    const results = await Promise.all(
      suggestions.map((s) =>
        fetch('/api/meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: s.date,
            meal_type: s.meal_type,
            recipe_id: s.recipe_id,
            servings: s.servings,
          }),
        }).then((r) => r.json())
      )
    );
    setEntries((prev) => [...prev, ...results.filter((r) => r?.id)]);
    setShowSuggest(false);
  }

  const todayStr = formatDate(new Date());
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = formatDate(new Date());
    const thisWeekDates = getWeekDates(getMondayOfWeek(new Date()));
    const isThisWeek = thisWeekDates.some(d => formatDate(d) === today);
    return isThisWeek ? today : formatDate(getWeekDates(weekStart)[0]);
  });

  // Keep selectedDay in sync when week changes
  useEffect(() => {
    const dates = getWeekDates(weekStart);
    const inWeek = dates.some(d => formatDate(d) === selectedDay);
    if (!inWeek) setSelectedDay(formatDate(dates[0]));
  }, [weekStart, selectedDay]);

  const MEAL_COLORS_MOBILE: Record<string, { bg: string; text: string; dot: string }> = {
    breakfast: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    lunch: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    dinner: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
    snack: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6 md:pt-6">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-[var(--surface-2)] text-[var(--text-muted)]">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--text)] leading-tight">
              {format(weekStart, 'MMM d')} – {format(weekDates[6], 'MMM d')}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">{format(weekStart, 'yyyy')}</p>
          </div>
          <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-[var(--surface-2)] text-[var(--text-muted)]">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setWeekStart(getMondayOfWeek(new Date())); setSelectedDay(todayStr); }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] active:bg-[var(--surface-2)]"
            style={{ background: 'var(--surface)' }}
          >
            Today
          </button>
          <Button variant="secondary" size="sm" onClick={() => setShowSuggest(true)}>
            <Sparkles size={13} />
            <span className="hidden sm:inline">AI Suggest</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mx-4 h-64 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      ) : (
        <>
          {calView === 'month' ? (
            <div className="px-4 md:px-6">
              <MonthView
                weekStart={weekStart}
                entries={entries}
                onSelectWeek={(d) => { setWeekStart(d); setCalView('week'); }}
                onAddMeal={(date, mealType) => setAddModal({ date, mealType })}
              />
            </div>
          ) : (
            <>
              {/* ── Mobile Day View (shown on small screens) ── */}
              <div className="md:hidden">
                {/* Day chips */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
                  {weekDates.map((date, i) => {
                    const dateStr = formatDate(date);
                    const isSelected = dateStr === selectedDay;
                    const isTodayDate = dateStr === todayStr;
                    const dayEntries = entries.filter(e => e.date === dateStr);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDay(dateStr)}
                        className="flex flex-col items-center gap-1 shrink-0 w-12 py-2 rounded-2xl"
                        style={{
                          background: isSelected ? 'var(--primary)' : isTodayDate ? 'rgba(16,185,129,0.08)' : 'var(--surface)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : isTodayDate ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                        }}
                      >
                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : isTodayDate ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                          {DAY_LABELS[i]}
                        </span>
                        <span className={`text-base font-bold ${isSelected ? 'text-white' : isTodayDate ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                          {format(date, 'd')}
                        </span>
                        {dayEntries.length > 0 && (
                          <div className="flex gap-0.5">
                            {dayEntries.slice(0, 3).map((e, ei) => (
                              <span key={ei} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : MEAL_COLORS_MOBILE[e.meal_type]?.dot ?? 'bg-gray-400'}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected day meals */}
                <div className="px-4 space-y-2 pb-4">
                  <p className="text-sm font-semibold text-[var(--text)] mb-3">
                    {format(new Date(selectedDay + 'T00:00'), 'EEEE, MMMM d')}
                  </p>
                  {MEAL_TYPES.map((mealType) => {
                    const entry = getEntry(selectedDay, mealType);
                    const colors = MEAL_COLORS_MOBILE[mealType];
                    return (
                      <div key={mealType} className="rounded-2xl border border-[var(--border)] overflow-hidden"
                        style={{ background: 'var(--surface)' }}>
                        {/* Meal type header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]"
                          style={{ background: 'var(--surface-2)' }}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                              {mealType}
                            </span>
                          </div>
                          {!entry && (
                            <button
                              onClick={() => setAddModal({ date: selectedDay, mealType })}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text}`}
                            >
                              <Plus size={12} /> Add
                            </button>
                          )}
                        </div>

                        {entry ? (
                          <div className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text)] truncate">{entry.recipe?.name}</p>
                                {entry.recipe && (() => {
                                  const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
                                  return (
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                      {Math.round(m.calories)} cal · {roundMacro(m.protein)}g protein
                                    </p>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleServingChange(entry.id, Math.max(0.5, entry.servings - 0.5))}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] active:bg-[var(--surface-2)]"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <span className="text-sm font-bold text-[var(--primary)] w-8 text-center">{entry.servings}x</span>
                                <button
                                  onClick={() => handleServingChange(entry.id, entry.servings + 0.5)}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] active:bg-[var(--surface-2)]"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemove(entry.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] active:text-red-400 active:bg-red-500/10"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddModal({ date: selectedDay, mealType })}
                            className="w-full px-4 py-4 flex items-center gap-2 text-[var(--text-muted)] active:bg-[var(--surface-2)]"
                          >
                            <Plus size={15} />
                            <span className="text-sm">Add {mealType}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Desktop Grid View (hidden on mobile) ── */}
              <div className="hidden md:block px-6 pb-6">
                {entries.length === 0 && (
                  <div className="mb-4 rounded-2xl border border-[var(--primary)]/20 px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(16,185,129,0.05)' }}>
                    <span className="text-xl shrink-0">👆</span>
                    <p className="text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)]">Click any cell</span> to add a meal.
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div />
                      {weekDates.map((date, i) => (
                        <div key={i} className={`text-center py-2 rounded-xl ${isToday(date) ? 'bg-[var(--primary)]/10' : ''}`}>
                          <p className="text-xs text-[var(--text-muted)]">{DAY_LABELS[i]}</p>
                          <p className={`text-base font-bold ${isToday(date) ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                            {format(date, 'd')}
                          </p>
                        </div>
                      ))}
                    </div>
                    {MEAL_TYPES.map((mealType) => (
                      <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-[var(--text-muted)] capitalize">{mealType}</span>
                        </div>
                        {weekDates.map((date, i) => {
                          const dateStr = formatDate(date);
                          const entry = getEntry(dateStr, mealType);
                          return (
                            <MealSlot
                              key={i}
                              date={dateStr}
                              mealType={mealType}
                              entry={entry}
                              onAdd={(d, mt) => setAddModal({ date: d, mealType: mt })}
                              onRemove={handleRemove}
                              onServingChange={handleServingChange}
                              onViewDetail={(e) => setDetailEntry(e)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={!!addModal}
        onClose={() => setAddModal(null)}
        title={addModal ? `Add ${addModal.mealType} — ${format(new Date(addModal.date + 'T00:00'), 'EEE, MMM d')}` : ''}
        size="lg"
      >
        {addModal && (
          <AddMealModalContent
            recipes={recipes}
            date={addModal.date}
            mealType={addModal.mealType}
            onAdd={handleAdd}
            onClose={() => setAddModal(null)}
            onQuickAdd={(entry) => {
              setEntries((prev) => [...prev, entry]);
              setAddModal(null);
              // Auto-add ingredients for food-library quick-add
              if (entry.recipe) {
                pushToGrocery(entry.recipe, entry.servings).then((count) =>
                  showGroceryToast(count, entry.recipe!.name)
                );
              }
            }}
          />
        )}
      </Modal>

      {/* Meal detail — ingredient list */}
      <Modal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title={detailEntry ? `${detailEntry.recipe?.name ?? 'Meal'} — ${format(new Date(detailEntry.date + 'T00:00'), 'EEE, MMM d')}` : ''}
        size="md"
      >
        {detailEntry && (
          <MealDetailContent
            entry={detailEntry}
            onAddToGrocery={async () => {
              if (!detailEntry.recipe) return;
              const count = await pushToGrocery(detailEntry.recipe, detailEntry.servings);
              setDetailEntry(null);
              showGroceryToast(count, detailEntry.recipe.name);
            }}
          />
        )}
      </Modal>

      {/* Grocery add toast */}
      {groceryToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white"
          style={{ background: 'var(--primary)', maxWidth: 'calc(100vw - 32px)' }}>
          <ShoppingCart size={15} />
          {groceryToast}
        </div>
      )}

      <SuggestModal
        open={showSuggest}
        onClose={() => setShowSuggest(false)}
        weekStart={weekStart}
        weekDates={weekDates}
        existingEntries={entries}
        onApply={handleApplySuggestions}
      />

    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  weekStart, entries, onSelectWeek, onAddMeal,
}: {
  weekStart: Date;
  entries: MealPlanEntry[];
  onSelectWeek: (monday: Date) => void;
  onAddMeal: (date: string, mealType: MealType) => void;
}) {
  // Show 4 weeks starting from the current weekStart's Monday
  const monday = getMondayOfWeek(weekStart);
  const weeks: Date[][] = [];
  for (let w = 0; w < 4; w++) {
    const weekMonday = new Date(monday);
    weekMonday.setDate(monday.getDate() + w * 7);
    weeks.push(getWeekDates(weekMonday));
  }

  const entryMap = new Map<string, MealPlanEntry[]>();
  for (const e of entries) {
    const arr = entryMap.get(e.date) ?? [];
    arr.push(e);
    entryMap.set(e.date, arr);
  }

  const MEAL_COLORS_DOT: Record<string, string> = {
    breakfast: 'bg-amber-400',
    lunch: 'bg-[var(--primary)]',
    dinner: 'bg-purple-400',
    snack: 'bg-blue-400',
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)] mb-2">Click a week row to plan it, or click a day to add a meal.</p>
      {weeks.map((weekDays, wi) => {
        const wMonday = weekDays[0];
        const wLabel = `${format(wMonday, 'MMM d')} – ${format(weekDays[6], 'MMM d')}`;
        const weekEntryCount = weekDays.reduce((acc, d) => {
          return acc + (entryMap.get(formatDate(d))?.length ?? 0);
        }, 0);

        return (
          <div key={wi} className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
            {/* Week header */}
            <button
              onClick={() => onSelectWeek(wMonday)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <CalendarDays size={13} className="text-[var(--primary)]" />
                <span className="text-xs font-semibold text-[var(--text)]">{wLabel}</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                {weekEntryCount > 0 ? `${weekEntryCount} meal${weekEntryCount !== 1 ? 's' : ''} planned` : 'Empty — tap to plan'}
              </span>
            </button>

            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
              {weekDays.map((date, di) => {
                const dateStr = formatDate(date);
                const dayEntries = entryMap.get(dateStr) ?? [];
                const today = isToday(date);

                return (
                  <button
                    key={di}
                    onClick={() => onAddMeal(dateStr, 'dinner')}
                    className={`flex flex-col items-center gap-1 py-3 px-1 hover:bg-[var(--surface-2)] transition-colors ${today ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    <span className={`text-[10px] font-semibold ${today ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                      {DAY_LABELS[di]}
                    </span>
                    <span className={`text-sm font-bold ${today ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                      {format(date, 'd')}
                    </span>
                    <div className="flex gap-0.5 flex-wrap justify-center min-h-[8px]">
                      {dayEntries.slice(0, 4).map((e, ei) => (
                        <span key={ei} className={`w-1.5 h-1.5 rounded-full ${MEAL_COLORS_DOT[e.meal_type] ?? 'bg-gray-400'}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs text-[var(--text-muted)] pt-1">
        Colored dots = planned meals · Click any week header to switch to week view
      </p>
    </div>
  );
}

function MealDetailContent({
  entry,
  onAddToGrocery,
}: {
  entry: MealPlanEntry;
  onAddToGrocery: () => Promise<void>;
}) {
  const recipe = entry.recipe;
  const s = entry.servings;
  const [adding, setAdding] = useState(false);

  if (!recipe) return <p className="text-sm text-[var(--text-muted)]">Recipe data unavailable.</p>;

  const ings = recipe.ingredients ?? [];

  async function handleAddToGrocery() {
    setAdding(true);
    await onAddToGrocery();
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Serving count + Add to grocery button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          {s} serving{s !== 1 ? 's' : ''} · {ings.length} ingredient{ings.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={handleAddToGrocery}
          disabled={adding}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 disabled:opacity-50"
        >
          <ShoppingCart size={12} />
          {adding ? 'Adding…' : 'Add to grocery list'}
        </button>
      </div>

      {/* Ingredient list */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Ingredients — scaled to {s} serving{s !== 1 ? 's' : ''}
        </p>
        {ings.length === 0 ? (
          <div className="rounded-xl px-4 py-5 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-sm text-[var(--text-muted)]">No ingredients saved for this recipe.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Open Recipes and add ingredients to see them here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ings.map((ing, i) => {
              const amount = ing.amount_per_serving * s;
              return (
                <div
                  key={ing.id ?? i}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                    <p className="text-sm font-medium text-[var(--text)] truncate">{ing.name}</p>
                  </div>
                  <span className="text-sm text-[var(--text-muted)] shrink-0">
                    {Number.isInteger(amount) ? amount : Math.round(amount * 10) / 10} {ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const FOOD_CATEGORIES = [
  'All', 'Meals', 'Protein', 'Breakfast', 'Fast Food',
  'Grains', 'Vegetables', 'Fruits', 'Dairy', 'Snacks',
  'Nuts & Seeds', 'Legumes', 'Beverages', 'Oils & Fats',
];

function AddMealModalContent({
  recipes,
  date,
  mealType,
  onAdd,
  onClose,
  onQuickAdd,
}: {
  recipes: Recipe[];
  date: string;
  mealType: MealType;
  onAdd: (recipe: Recipe, servings: number) => void;
  onClose: () => void;
  onQuickAdd: (entry: MealPlanEntry) => void;
}) {
  const [tab, setTab] = useState<'recipes' | 'library'>('recipes');
  const [search, setSearch] = useState('');
  const [recipeServings, setRecipeServings] = useState<Record<string, number>>({});
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [foodServings, setFoodServings] = useState<Record<string, number>>({});
  const [category, setCategory] = useState('All');
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search food library with debounce
  useEffect(() => {
    if (tab !== 'library') return;
    setLoadingFoods(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category !== 'All') params.set('category', category);
      const res = await fetch(`/api/foods?${params}`);
      const data = await res.json();
      setFoods(data ?? []);
      setLoadingFoods(false);
    }, 300);
  }, [search, category, tab]);

  // Focus search on open
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [tab]);

  const filteredRecipes = recipes
    .filter((r) => !(r as Recipe & { is_quick_add?: boolean }).is_quick_add)
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  async function handleQuickAdd(food: FoodItem) {
    setAddingId(food.id);
    const s = foodServings[food.id] ?? 1;
    const res = await fetch('/api/foods/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_id: food.id, date, meal_type: mealType, servings: s }),
    });
    const entry = await res.json();
    setAddingId(null);
    if (entry.id) onQuickAdd(entry);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-1 gap-1">
        <button
          onClick={() => setTab('recipes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'recipes' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <BookOpen size={14} />
          Recipes {recipes.length > 0 && <span className={`text-[11px] px-1.5 py-0.5 rounded-full ml-0.5 ${tab === 'recipes' ? 'bg-white/20' : 'bg-[var(--border)]'}`}>{recipes.filter((r) => !(r as Recipe & { is_quick_add?: boolean }).is_quick_add).length}</span>}
        </button>
        <button
          onClick={() => setTab('library')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'library' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Database size={14} />
          Quick Foods
        </button>
      </div>

      {/* Search */}
      <input
        ref={searchRef}
        type="text"
        placeholder={tab === 'library' ? 'Search individual foods…' : 'Search recipes…'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-all"
      />

      {/* Category filter (food library only) */}
      {tab === 'library' && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                category === cat
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
        {tab === 'library' ? (
          loadingFoods ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-[var(--surface-2)] animate-pulse" />
            ))
          ) : foods.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No foods found for &quot;{search}&quot;</p>
          ) : (
            foods.map((food) => {
              const s = foodServings[food.id] ?? 1;
              return (
                <div key={food.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{food.name}</p>
                      <Badge variant="muted">{food.category}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {food.serving_label} · <span className="text-amber-400">{Math.round(food.calories * s)} cal</span>
                      {' · '}<span className="text-[var(--primary)]">{roundMacro(food.protein * s)}g pro</span>
                      {' · '}<span className="text-blue-400">{roundMacro(food.carbs * s)}g carb</span>
                      {' · '}<span className="text-purple-400">{roundMacro(food.fat * s)}g fat</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFoodServings((p) => ({ ...p, [food.id]: Math.max(0.5, (p[food.id] ?? 1) - 0.5) }))}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <span className="text-sm font-medium text-[var(--text)] min-w-[24px] text-center">{s}x</span>
                      <button
                        onClick={() => setFoodServings((p) => ({ ...p, [food.id]: (p[food.id] ?? 1) + 0.5 }))}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <ChevronUp size={13} />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      loading={addingId === food.id}
                      onClick={() => handleQuickAdd(food)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">
                {search ? `No recipes match "${search}".` : 'No recipes yet.'}
              </p>
              {!search && (
                <button onClick={onClose} className="text-xs text-[var(--primary)] mt-1 hover:underline">
                  Go to Recipes to import starter meals →
                </button>
              )}
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const s = recipeServings[recipe.id] ?? recipe.default_servings;
              return (
                <div key={recipe.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{recipe.name}</p>
                    {recipe.description && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{recipe.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRecipeServings((p) => ({ ...p, [recipe.id]: Math.max(0.5, (p[recipe.id] ?? recipe.default_servings) - 0.5) }))}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <span className="text-sm font-medium text-[var(--text)] min-w-[28px] text-center">{s}x</span>
                      <button
                        onClick={() => setRecipeServings((p) => ({ ...p, [recipe.id]: (p[recipe.id] ?? recipe.default_servings) + 0.5 }))}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                    </div>
                    <Button size="sm" onClick={() => onAdd(recipe, s)}>Add</Button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}

// ─── AI Suggest Modal ───────────────────────────────────────────────────────

function SuggestModal({
  open,
  onClose,
  weekStart,
  weekDates,
  existingEntries,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  weekStart: Date;
  weekDates: Date[];
  existingEntries: MealPlanEntry[];
  onApply: (entries: SuggestionItem[]) => Promise<void>;
}) {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [prefs, setPrefs] = useState('');
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  function makeKey(s: { date: string; meal_type: string }) {
    return `${s.date}__${s.meal_type}`;
  }

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/meal-plans/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs, weekStart: formatDate(weekStart) }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const taken = new Set(existingEntries.map(makeKey));
      const filtered = (data.suggestions as SuggestionItem[]).filter((s) => !taken.has(makeKey(s)));

      setSuggestions(filtered);
      setSelected(new Set(filtered.map(makeKey)));
      setStep('preview');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function apply() {
    setApplying(true);
    await onApply(suggestions.filter((s) => selected.has(makeKey(s))));
    setApplying(false);
    handleClose();
  }

  function handleClose() {
    setStep('input');
    setPrefs('');
    setSuggestions([]);
    setSelected(new Set());
    setError('');
    onClose();
  }

  function toggleKey(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const selectedCount = selected.size;

  return (
    <Modal open={open} onClose={handleClose} title="AI Meal Suggestions" size="lg">
      {step === 'input' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            Describe your goals or preferences and Claude will suggest a 7-day meal plan from your saved recipes.
          </p>
          <div>
            <label className="block text-sm font-medium text-[var(--text-dim)] mb-1.5">
              Preferences or goals
            </label>
            <textarea
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              placeholder="e.g. high protein, no gluten, quick meals, low carb…"
              rows={4}
              className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-all resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={generate} loading={generating}>
              <Sparkles size={14} />
              Generate Week Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              {suggestions.length === 0
                ? 'All meal slots are already filled for this week.'
                : `${selectedCount} of ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} selected`}
            </p>
            {suggestions.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setSelected(new Set(suggestions.map(makeKey)))}
                  className="text-[var(--primary)] hover:opacity-70 transition-opacity"
                >
                  Select all
                </button>
                <span className="text-[var(--border-2)]">·</span>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  None
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-0.5">
            {weekDates.map((date, i) => {
              const dateStr = formatDate(date);
              const daySuggs = suggestions
                .filter((s) => s.date === dateStr)
                .sort((a, b) => (SUGGEST_MEAL_ORDER[a.meal_type] ?? 0) - (SUGGEST_MEAL_ORDER[b.meal_type] ?? 0));
              if (daySuggs.length === 0) return null;
              return (
                <div
                  key={dateStr}
                  className="rounded-xl border border-[var(--border)] overflow-hidden"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="px-3 py-2 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
                    <span className="text-xs font-semibold text-[var(--text)]">
                      {DAY_LABELS[i]} · {format(date, 'MMM d')}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {daySuggs.map((s) => {
                      const key = makeKey(s);
                      const isSelected = selected.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleKey(key)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                            isSelected
                              ? 'bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10'
                              : 'opacity-40 hover:opacity-70'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-[var(--primary)] border-[var(--primary)]'
                                : 'border-[var(--border-2)]'
                            }`}
                          >
                            {isSelected && <Check size={9} className="text-white" />}
                          </div>
                          <span className="flex-1 text-sm font-medium text-[var(--text)] truncate">
                            {s.recipe_name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${SUGGEST_MEAL_COLORS[s.meal_type]}`}>
                            {SUGGEST_MEAL_LABELS[s.meal_type]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
              ← Try again
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={apply} loading={applying} disabled={selectedCount === 0}>
                {applying ? 'Applying…' : `Apply ${selectedCount > 0 ? selectedCount : ''} Meal${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
