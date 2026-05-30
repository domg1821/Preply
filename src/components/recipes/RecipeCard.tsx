'use client';
import { useState } from 'react';
import { BookOpen, Trash2, Users, Star, ChevronDown, Clock, Flame, ChefHat } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { calcRecipeMacros, roundMacro } from '@/lib/utils';
import { Recipe } from '@/types';
import { CookModeModal } from './CookModeModal';

interface Props {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  onClick?: (recipe: Recipe) => void;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
}

export function RecipeCard({ recipe, onDelete, onClick, onFavoriteToggle }: Props) {
  const [favorite, setFavorite] = useState(recipe.is_favorite ?? false);
  const [favLoading, setFavLoading] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCookMode, setShowCookMode] = useState(false);
  const macros = calcRecipeMacros(recipe.ingredients, 1);
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const next = !favorite;
    setFavorite(next);
    await fetch(`/api/recipes/${recipe.id}/favorite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: next }),
    });
    setFavLoading(false);
    onFavoriteToggle?.(recipe.id, next);
  }

  return (
    <>
    <div
      onClick={() => onClick?.(recipe)}
      className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 hover:border-[var(--border-2)] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] leading-tight">{recipe.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-muted)]">
              <Users size={11} />
              <span>{recipe.default_servings} serving{recipe.default_servings !== 1 ? 's' : ''}</span>
              {(recipe.ingredients?.length ?? 0) > 0 && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleFavorite}
            className={`p-2.5 rounded-xl transition-all ${
              favorite
                ? 'text-amber-400'
                : 'text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 md:opacity-0 md:group-hover:opacity-100'
            }`}
            title={favorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
              className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all md:opacity-0 md:group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {recipe.description && (
        <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{recipe.description}</p>
      )}

      {/* Macro pills */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Cal', value: Math.round(macros.calories), color: 'text-amber-400' },
          { label: 'Pro', value: `${roundMacro(macros.protein)}g`, color: 'text-[var(--primary)]' },
          { label: 'Carb', value: `${roundMacro(macros.carbs)}g`, color: 'text-blue-400' },
          { label: 'Fat', value: `${roundMacro(macros.fat)}g`, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center rounded-lg bg-[var(--surface-2)] py-1.5">
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Time + Cook Mode row */}
      {(totalTime > 0 || (recipe.steps && recipe.steps.length > 0)) && (
        <div className="flex items-center justify-between mb-3 pt-1">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            {recipe.prep_time ? (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {recipe.prep_time}m prep
              </span>
            ) : null}
            {recipe.cook_time ? (
              <span className="flex items-center gap-1">
                <Flame size={11} className="text-orange-400" /> {recipe.cook_time}m cook
              </span>
            ) : null}
            {totalTime > 0 && (
              <span className="font-semibold text-[var(--text)]">{totalTime}m total</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCookMode(true); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--primary), #059669)', color: '#fff' }}
          >
            <ChefHat size={12} />
            Cook Mode
          </button>
        </div>
      )}

      {!(totalTime > 0 || (recipe.steps && recipe.steps.length > 0)) && (
        <div className="flex justify-end mb-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowCookMode(true); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all"
          >
            <ChefHat size={12} />
            Cook Mode
          </button>
        </div>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="muted">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Ingredient toggle */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setShowIngredients((v) => !v); }}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors w-full pt-1 border-t border-[var(--border)]"
          >
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${showIngredients ? 'rotate-180' : ''}`}
            />
            {showIngredients ? 'Hide' : 'Show'} ingredients ({recipe.ingredients.length})
          </button>
          {showIngredients && (
            <div className="mt-2 flex flex-col gap-1">
              {recipe.ingredients.map((ing, i) => (
                <div key={ing.id ?? i} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]/50 last:border-0">
                  <span className="text-[var(--text)] font-medium">{ing.name}</span>
                  <span className="text-[var(--text-muted)] shrink-0 ml-2">
                    {Number.isInteger(ing.amount_per_serving) ? ing.amount_per_serving : Math.round(ing.amount_per_serving * 10) / 10} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>

    {showCookMode && (
      <CookModeModal
        recipe={recipe}
        onClose={() => setShowCookMode(false)}
      />
    )}
  </>
  );
}
