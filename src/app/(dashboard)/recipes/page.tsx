'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Clock, Flame, Beef, Wheat, Droplets, ShoppingCart, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeBuilder } from '@/components/recipes/RecipeBuilder';
import { Recipe } from '@/types';
import { calcRecipeMacros, roundMacro } from '@/lib/utils';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ added: number; skipped: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleSave(data: Parameters<typeof RecipeBuilder>[0]['onSave'] extends (d: infer D) => unknown ? D : never) {
    setSaving(true);
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setShowBuilder(false);
    fetchRecipes();
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    await fetch(`/api/recipes/${confirmDeleteId}`, { method: 'DELETE' });
    setRecipes((prev) => prev.filter((r) => r.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }

  async function handleSeedTemplates() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/recipes/seed', { method: 'POST' });
      const data = await res.json();
      setSeedResult(data);
      if (data.added > 0) fetchRecipes();
    } catch {
      setSeedResult({ added: 0, skipped: 0 });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text)]">Recipes</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{recipes.length} saved</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleSeedTemplates} loading={seeding}>
            <Download size={14} />
            <span className="hidden sm:inline">{seeding ? 'Loading…' : 'Browse Library'}</span>
            <span className="sm:hidden">{seeding ? '…' : 'Library'}</span>
          </Button>
          <Button size="sm" onClick={() => setShowBuilder(true)}>
            <Plus size={15} />
            <span className="hidden sm:inline">New Recipe</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {seedResult && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          seedResult.added > 0
            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]'
            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'
        }`}>
          {seedResult.added > 0
            ? `✓ Added ${seedResult.added} starter meal${seedResult.added !== 1 ? 's' : ''} to your library!`
            : `All starter meals are already in your library (${seedResult.skipped} skipped).`}
          <button className="ml-auto text-xs opacity-60 hover:opacity-100" onClick={() => setSeedResult(null)}>✕</button>
        </div>
      )}

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search recipes or tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[var(--text-muted)] text-sm">
            {search ? 'No recipes match your search.' : 'No recipes yet. Create your first one!'}
          </p>
          {!search && (
            <Button variant="secondary" onClick={() => setShowBuilder(true)}>
              <Plus size={16} />
              Create Recipe
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recent recipes — full row breakdown, only shown when not searching */}
          {!search && recipes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recently Added</h2>
              </div>
              <div className="flex flex-col gap-3">
                {recipes.slice(0, 3).map((recipe) => (
                  <RecentRecipeRow key={recipe.id} recipe={recipe} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Full library grid — when not searching, skip the first 3 already shown above */}
          {(search || recipes.length > 3) && (
            <div>
              {!search && recipes.length > 3 && (
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">All Recipes</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(search ? filtered : filtered.slice(3)).map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showBuilder} onClose={() => setShowBuilder(false)} title="New Recipe" size="xl">
        <RecipeBuilder
          onSave={handleSave}
          onCancel={() => setShowBuilder(false)}
          saving={saving}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete recipe?"
        message="This will permanently remove the recipe and cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

function RecentRecipeRow({ recipe, onDelete }: { recipe: Recipe; onDelete: (id: string) => void }) {
  const macros = calcRecipeMacros(recipe.ingredients, recipe.default_servings);
  const [addingToGrocery, setAddingToGrocery] = useState(false);
  const [added, setAdded] = useState(false);

  async function addIngredientsToGrocery(e: React.MouseEvent) {
    e.stopPropagation();
    if (!recipe.ingredients?.length) return;
    setAddingToGrocery(true);
    const items = recipe.ingredients.map((ing) => ({
      name: ing.name,
      amount: Math.round(ing.amount_per_serving * recipe.default_servings * 100) / 100,
      unit: ing.unit,
      source_recipe: recipe.name,
    }));
    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    setAddingToGrocery(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
      style={{ background: 'var(--surface)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="font-semibold text-[var(--text)] leading-tight">{recipe.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {recipe.default_servings} serving{recipe.default_servings !== 1 ? 's' : ''}
              {recipe.description ? ` · ${recipe.description}` : ''}
            </p>
          </div>
        </div>
        {/* Macro chips */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {[
            { val: Math.round(macros.calories), unit: 'cal', color: 'text-amber-400', Icon: Flame },
            { val: `${roundMacro(macros.protein)}g`, unit: 'pro', color: 'text-[var(--primary)]', Icon: Beef },
            { val: `${roundMacro(macros.carbs)}g`, unit: 'carb', color: 'text-blue-400', Icon: Wheat },
            { val: `${roundMacro(macros.fat)}g`, unit: 'fat', color: 'text-purple-400', Icon: Droplets },
          ].map(({ val, unit, color, Icon }) => (
            <div key={unit} className="flex items-center gap-1">
              <Icon size={11} className={color} />
              <span className={`text-xs font-semibold ${color}`}>{val}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{unit}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {recipe.ingredients?.length > 0 && (
            <button
              onClick={addIngredientsToGrocery}
              disabled={addingToGrocery}
              title="Add ingredients to grocery list"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                added
                  ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
              }`}
            >
              <ShoppingCart size={12} />
              {added ? 'Added!' : 'Add to list'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Ingredient table */}
      {recipe.ingredients && recipe.ingredients.length > 0 ? (
        <div className="divide-y divide-[var(--border)]">
          {recipe.ingredients.map((ing, i) => {
            const scaled = Math.round(ing.amount_per_serving * recipe.default_servings * 10) / 10;
            const cal = Math.round((ing.calories_per_unit ?? 0) * ing.amount_per_serving * recipe.default_servings);
            return (
              <div key={ing.id ?? i}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/40 shrink-0" />
                  <span className="text-sm text-[var(--text)]">{ing.name}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-sm font-medium text-[var(--text)]">
                    {scaled} <span className="text-[var(--text-muted)] text-xs font-normal">{ing.unit}</span>
                  </span>
                  {cal > 0 && (
                    <span className="text-xs text-amber-400 font-medium w-14 text-right">{cal} cal</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-[var(--text-muted)] italic">No ingredients saved for this recipe.</p>
      )}
    </div>
  );
}
