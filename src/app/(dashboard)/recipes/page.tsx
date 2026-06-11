'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Clock, Flame, Beef, Wheat, Droplets, ShoppingCart, Trash2, Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeBuilder } from '@/components/recipes/RecipeBuilder';
import { Recipe } from '@/types';
import { calcRecipeMacros, roundMacro } from '@/lib/utils';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  breakfast:      { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
  lunch:          { bg: 'rgba(16,185,129,0.12)',   text: '#10B981' },
  dinner:         { bg: 'rgba(139,92,246,0.12)',   text: '#8B5CF6' },
  snack:          { bg: 'rgba(6,182,212,0.12)',    text: '#06B6D4' },
  'high-protein': { bg: 'rgba(16,185,129,0.12)',   text: '#10B981' },
  vegetarian:     { bg: 'rgba(34,197,94,0.12)',    text: '#22C55E' },
  vegan:          { bg: 'rgba(34,197,94,0.12)',    text: '#22C55E' },
  keto:           { bg: 'rgba(245,158,11,0.12)',   text: '#F59E0B' },
  default:        { bg: 'rgba(148,163,184,0.1)',   text: '#94A3B8' },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag.toLowerCase()] ?? TAG_COLORS.default;
}

export default function RecipesPage() {
  const [recipes,          setRecipes]          = useState<Recipe[]>([]);
  const [search,           setSearch]           = useState('');
  const [activeTag,        setActiveTag]        = useState<string | null>(null);
  const [showBuilder,      setShowBuilder]      = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [seeding,          setSeeding]          = useState(false);
  const [seedResult,       setSeedResult]       = useState<{ added: number; skipped: number } | null>(null);
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/recipes');
    setRecipes((await res.json()) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags ?? []))).sort();

  const filtered = recipes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchTag = !activeTag || r.tags?.includes(activeTag);
    return matchSearch && matchTag;
  });

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

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    await fetch(`/api/recipes/${confirmDeleteId}`, { method: 'DELETE' });
    setRecipes(prev => prev.filter(r => r.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }

  async function handleSeedTemplates() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res  = await fetch('/api/recipes/seed', { method: 'POST' });
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Recipes</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{recipes.length} saved</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleSeedTemplates} loading={seeding}>
            <Download size={14} />
            <span className="hidden sm:inline">{seeding ? 'Loading…' : 'Browse Library'}</span>
            <span className="sm:hidden">{seeding ? '…' : 'Library'}</span>
          </Button>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-2xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', boxShadow: '0 4px 16px rgba(139,92,246,0.35)' }}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Recipe</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {seedResult && (
        <div
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium"
          style={{
            background: seedResult.added > 0 ? 'rgba(16,185,129,0.08)' : 'var(--surface)',
            border: `1px solid ${seedResult.added > 0 ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
            color: seedResult.added > 0 ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          <Sparkles size={14} />
          {seedResult.added > 0
            ? `Added ${seedResult.added} starter meal${seedResult.added !== 1 ? 's' : ''} to your library!`
            : `All starter meals are already in your library (${seedResult.skipped} skipped).`}
          <button className="ml-auto opacity-60 hover:opacity-100" onClick={() => setSeedResult(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search + tag filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search recipes or tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {allTags.map(tag => {
              const ts = tagStyle(tag);
              const on = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(on ? null : tag)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: on ? ts.text : ts.bg,
                    color: on ? '#fff' : ts.text,
                    border: `1px solid ${ts.text}28`,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-48 rounded-2xl shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Search size={24} style={{ color: '#8B5CF6' }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--text)]">{search || activeTag ? 'No recipes match' : 'No recipes yet'}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {search || activeTag ? 'Try a different search or filter' : 'Create your first recipe or browse the library'}
            </p>
          </div>
          {!search && !activeTag && (
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
            >
              <Plus size={15} />Create Recipe
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {!search && !activeTag && recipes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Recently Added
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {recipes.slice(0, 3).map(recipe => (
                  <RecentRecipeRow key={recipe.id} recipe={recipe} onDelete={setConfirmDeleteId} />
                ))}
              </div>
            </div>
          )}

          {(search || activeTag || recipes.length > 3) && (
            <div>
              {!search && !activeTag && recipes.length > 3 && (
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  All Recipes
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(search || activeTag ? filtered : filtered.slice(3)).map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onDelete={setConfirmDeleteId} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showBuilder} onClose={() => setShowBuilder(false)} title="New Recipe" size="xl">
        <RecipeBuilder onSave={handleSave} onCancel={() => setShowBuilder(false)} saving={saving} />
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
  const macros      = calcRecipeMacros(recipe.ingredients, recipe.default_servings);
  const [adding,    setAdding]    = useState(false);
  const [added,     setAdded]     = useState(false);
  const accentColor = recipe.tags?.[0] ? (tagStyle(recipe.tags[0])).text : '#8B5CF6';

  async function addIngredientsToGrocery(e: React.MouseEvent) {
    e.stopPropagation();
    if (!recipe.ingredients?.length) return;
    setAdding(true);
    const items = recipe.ingredients.map(ing => ({
      name: ing.name,
      amount: Math.round(ing.amount_per_serving * recipe.default_servings * 100) / 100,
      unit: ing.unit,
      source_recipe: recipe.name,
    }));
    await fetch('/api/grocery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${accentColor}` }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <p className="font-bold text-[var(--text)] leading-tight truncate">{recipe.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {recipe.default_servings} serving{recipe.default_servings !== 1 ? 's' : ''}
              {recipe.description ? ` · ${recipe.description}` : ''}
            </p>
            {recipe.tags?.map(tag => {
              const ts = tagStyle(tag);
              return (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: ts.bg, color: ts.text }}>
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {[
            { val: Math.round(macros.calories), unit: 'cal',  color: '#F59E0B', Icon: Flame    },
            { val: `${roundMacro(macros.protein)}g`, unit: 'pro',  color: '#10B981', Icon: Beef     },
            { val: `${roundMacro(macros.carbs)}g`,   unit: 'carb', color: '#06B6D4', Icon: Wheat    },
            { val: `${roundMacro(macros.fat)}g`,     unit: 'fat',  color: '#8B5CF6', Icon: Droplets },
          ].map(({ val, unit, color, Icon }) => (
            <div key={unit} className="flex items-center gap-1">
              <Icon size={11} style={{ color }} />
              <span className="text-xs font-bold" style={{ color }}>{val}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {recipe.ingredients?.length > 0 && (
            <button
              onClick={addIngredientsToGrocery}
              disabled={adding}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all"
              style={added
                ? { color: 'var(--primary)', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)' }
                : { color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'transparent' }}
            >
              <ShoppingCart size={12} />{added ? 'Added!' : 'Add to list'}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(recipe.id); }}
            className="p-1.5 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {recipe.ingredients && recipe.ingredients.length > 0 ? (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recipe.ingredients.map((ing, i) => {
            const scaled = Math.round(ing.amount_per_serving * recipe.default_servings * 10) / 10;
            const cal    = Math.round((ing.calories_per_unit ?? 0) * ing.amount_per_serving * recipe.default_servings);
            return (
              <div key={ing.id ?? i}
                className="flex items-center justify-between px-4 py-2.5 transition-colors"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `${accentColor}80` }} />
                  <span className="text-sm text-[var(--text)]">{ing.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {scaled} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{ing.unit}</span>
                  </span>
                  {cal > 0 && <span className="text-xs font-bold w-14 text-right" style={{ color: '#F59E0B' }}>{cal} cal</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs italic" style={{ color: 'var(--text-muted)' }}>No ingredients saved.</p>
      )}
    </div>
  );
}
