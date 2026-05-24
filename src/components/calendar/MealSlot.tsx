'use client';
import { Plus, X, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MealPlanEntry, MealType } from '@/types';
import { calcRecipeMacros, roundMacro } from '@/lib/utils';

interface Props {
  date: string;
  mealType: MealType;
  entry?: MealPlanEntry;
  onAdd: (date: string, mealType: MealType) => void;
  onRemove: (id: string) => void;
  onServingChange: (id: string, servings: number) => void;
  onViewDetail?: (entry: MealPlanEntry) => void;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function MealSlot({ date, mealType, entry, onAdd, onRemove, onServingChange, onViewDetail }: Props) {
  const router = useRouter();
  const macros = entry?.recipe
    ? calcRecipeMacros(entry.recipe.ingredients, entry.servings)
    : null;

  return (
    <div className="relative min-h-[80px] rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--border-2)] transition-colors group">
      {entry ? (
        <div className="p-2.5 h-full flex flex-col gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); router.push('/grocery'); }}
            title="View grocery list"
            className="absolute top-1 right-1 p-0.5 rounded text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors z-10"
          >
            <ShoppingCart size={10} />
          </button>
          <div className="flex items-start justify-between gap-1">
            <button
              onClick={() => onViewDetail?.(entry)}
              className="text-xs font-medium text-[var(--text)] leading-tight line-clamp-2 flex-1 text-left hover:text-[var(--primary)] transition-colors"
            >
              {entry.recipe?.name}
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0"
            >
              <X size={12} />
            </button>
          </div>
          {macros && (
            <p className="text-xs text-[var(--text-muted)]">
              {Math.round(macros.calories)} cal · {roundMacro(macros.protein)}g pro
            </p>
          )}
          <div className="flex items-center gap-1 mt-auto">
            <button
              onClick={() => onServingChange(entry.id, Math.max(0.5, entry.servings - 0.5))}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <ChevronDown size={12} />
            </button>
            <span className="text-xs font-medium text-[var(--primary)] min-w-[24px] text-center">
              {entry.servings}x
            </span>
            <button
              onClick={() => onServingChange(entry.id, entry.servings + 0.5)}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <ChevronUp size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onAdd(date, mealType)}
          className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus size={16} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">{MEAL_LABELS[mealType]}</span>
        </button>
      )}
    </div>
  );
}
