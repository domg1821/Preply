'use client';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
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
  const macros = entry?.recipe
    ? calcRecipeMacros(entry.recipe.ingredients, entry.servings)
    : null;

  return (
    <div className="relative min-h-[88px] rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--border-2)] transition-colors group">
      {entry ? (
        <div className="p-2 h-full flex flex-col gap-1">
          {/* Remove button — full 44pt tap area via negative margin trick */}
          <div className="flex items-start justify-between gap-1">
            <button
              onClick={() => onViewDetail?.(entry)}
              className="text-xs font-medium text-[var(--text)] leading-tight line-clamp-2 flex-1 text-left hover:text-[var(--primary)] transition-colors pt-1"
            >
              {entry.recipe?.name}
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="-mr-1 -mt-1 p-2.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 active:bg-red-500/10 transition-colors shrink-0"
              aria-label="Remove meal"
            >
              <X size={13} />
            </button>
          </div>
          {macros && (
            <p className="text-[11px] text-[var(--text-muted)] leading-none">
              {Math.round(macros.calories)} cal · {roundMacro(macros.protein)}g pro
            </p>
          )}
          <div className="flex items-center gap-0.5 mt-auto">
            <button
              onClick={() => onServingChange(entry.id, Math.max(0.5, entry.servings - 0.5))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] active:bg-[var(--surface-2)] transition-colors"
              aria-label="Decrease servings"
            >
              <ChevronDown size={13} />
            </button>
            <span className="text-xs font-medium text-[var(--primary)] min-w-[20px] text-center">
              {entry.servings}x
            </span>
            <button
              onClick={() => onServingChange(entry.id, entry.servings + 0.5)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] active:bg-[var(--surface-2)] transition-colors"
              aria-label="Increase servings"
            >
              <ChevronUp size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onAdd(date, mealType)}
          className="w-full h-full min-h-[88px] flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
        >
          <Plus size={16} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">{MEAL_LABELS[mealType]}</span>
        </button>
      )}
    </div>
  );
}
