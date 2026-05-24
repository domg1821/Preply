'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart, BookOpen, Database, Flame, Beef, Wheat, Droplets, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MealSlot } from '@/components/calendar/MealSlot';
import { Badge } from '@/components/ui/Badge';
import { MealPlanEntry, MealType, Recipe, FoodItem } from '@/types';
import { formatDate, getMondayOfWeek, getWeekDates, calcRecipeMacros, roundMacro } from '@/lib/utils';
import { format, isToday } from 'date-fns';

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
    const items: { name: string; amount: number; unit: string; source_recipe: string }[] = [];
    for (const entry of entries) {
      if (!entry.recipe) continue;
      const ings = entry.recipe.ingredients ?? [];
      if (ings.length > 0) {
        // Push each ingredient scaled to the planned servings
        for (const ing of ings) {
          const scaled = Math.round(ing.amount_per_serving * entry.servings * 100) / 100;
          items.push({
            name: ing.name,
            amount: scaled,
            unit: ing.unit,
            source_recipe: entry.recipe.name,
          });
        }
      } else {
        // Fallback: recipe has no saved ingredients — add the recipe as a single item
        items.push({
          name: entry.recipe.name,
          amount: entry.servings,
          unit: 'serving',
          source_recipe: entry.recipe.name,
        });
      }
    }
    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    setGeneratingGrocery(false);
    setGrocerySuccess(true);
    setTimeout(() => setGrocerySuccess(false), 3000);
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

  const weekMacros = entries.reduce(
    (acc, e) => {
      if (!e.recipe) return acc;
      const m = calcRecipeMacros(e.recipe.ingredients, e.servings);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Meal Calendar</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {format(weekStart, 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowSuggest(true)}>
            <Sparkles size={14} />
            AI Suggest
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push('/grocery')}>
            <ShoppingCart size={14} />
            Build Grocery List
          </Button>
          {entries.length > 0 && (
            <Button variant="secondary" size="sm" onClick={generateGroceryList} loading={generatingGrocery}>
              {grocerySuccess ? 'Synced!' : 'Sync Grocery List'}
            </Button>
          )}
          <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
            className="text-xs px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Today
          </button>
          <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Cal', value: Math.round(weekMacros.calories), color: 'text-amber-400' },
            { label: 'Protein', value: `${roundMacro(weekMacros.protein)}g`, color: 'text-[var(--primary)]' },
            { label: 'Carbs', value: `${roundMacro(weekMacros.carbs)}g`, color: 'text-blue-400' },
            { label: 'Fat', value: `${roundMacro(weekMacros.fat)}g`, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div />
              {weekDates.map((date, i) => (
                <div key={i} className={`text-center py-2 rounded-xl text-sm font-medium ${isToday(date) ? 'bg-[var(--primary)]/10' : ''}`}>
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
  const macros = calcRecipeMacros(ings, s);

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

      {/* Macro summary bar */}
      <div className="grid grid-cols-4 gap-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3">
        {[
          { label: 'Calories', value: Math.round(macros.calories), unit: 'kcal', color: 'text-amber-400', Icon: Flame },
          { label: 'Protein', value: roundMacro(macros.protein), unit: 'g', color: 'text-[var(--primary)]', Icon: Beef },
          { label: 'Carbs', value: roundMacro(macros.carbs), unit: 'g', color: 'text-blue-400', Icon: Wheat },
          { label: 'Fat', value: roundMacro(macros.fat), unit: 'g', color: 'text-purple-400', Icon: Droplets },
        ].map(({ label, value, unit, color, Icon }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <Icon size={13} className={color} />
            <p className={`text-sm font-bold ${color}`}>{value}<span className="text-[10px] font-normal ml-0.5">{unit}</span></p>
            <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
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
              const cal = Math.round((ing.calories_per_unit ?? 0) * amount);
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
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-sm text-[var(--text-muted)]">
                      {Number.isInteger(amount) ? amount : Math.round(amount * 10) / 10} {ing.unit}
                    </span>
                    {cal > 0 && (
                      <span className="text-xs text-amber-400 font-medium">{cal} cal</span>
                    )}
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
  const [tab, setTab] = useState<'recipes' | 'library'>('library');
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
          onClick={() => setTab('library')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'library' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Database size={14} />
          Food Library
        </button>
        <button
          onClick={() => setTab('recipes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'recipes' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <BookOpen size={14} />
          My Recipes
        </button>
      </div>

      {/* Search */}
      <input
        ref={searchRef}
        type="text"
        placeholder={tab === 'library' ? 'Search 200+ foods…' : 'Search your recipes…'}
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
                {search ? 'No recipes match.' : 'No saved recipes yet.'}
              </p>
              <button onClick={onClose} className="text-xs text-[var(--primary)] mt-1 hover:underline">
                Create your first recipe →
              </button>
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
