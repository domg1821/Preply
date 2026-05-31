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

export function MealSlot({ date, mealType, entry, onAdd, onRemove, onServingChange, onViewDetail }: Props) {
  const macros = entry?.recipe
    ? calcRecipeMacros(entry.recipe.ingredients, entry.servings)
    : null;

  if (!entry) {
    return (
      <button
        onClick={() => onAdd(date, mealType)}
        className="w-full min-h-[88px] rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center active:bg-[var(--surface-2)] active:border-[var(--primary)]"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Plus size={18} className="text-[var(--border-2)]" />
      </button>
    );
  }

  return (
    <div className="relative min-h-[88px] rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ background: 'var(--surface)' }}>
      <div className="p-2 h-full flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <button
            onClick={() => onViewDetail?.(entry)}
            className="text-xs font-medium text-[var(--text)] leading-tight line-clamp-2 flex-1 text-left pt-1 active:text-[var(--primary)]"
          >
            {entry.recipe?.name}
          </button>
          <button
            onClick={() => onRemove(entry.id)}
            className="p-2.5 rounded-lg text-[var(--text-muted)] active:text-red-400 active:bg-red-500/10 shrink-0"
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
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--surface-2)]"
            aria-label="Decrease servings"
          >
            <ChevronDown size={13} />
          </button>
          <span className="text-xs font-medium text-[var(--primary)] min-w-[20px] text-center">
            {entry.servings}x
          </span>
          <button
            onClick={() => onServingChange(entry.id, entry.servings + 0.5)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--surface-2)]"
            aria-label="Increase servings"
          >
            <ChevronUp size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
