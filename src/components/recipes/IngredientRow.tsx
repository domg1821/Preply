'use client';
import { useState } from 'react';
import { Trash2, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FoodItem } from '@/types';

export interface IngredientDraft {
  id: string;
  name: string;
  amount: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface Props {
  ingredient: IngredientDraft;
  onChange: (id: string, field: keyof IngredientDraft, value: string) => void;
  onRemove: (id: string) => void;
}

const UNITS = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'ml', 'l', 'lb', 'piece', 'count', 'slice', 'whole', 'cloves'];

export function IngredientRow({ ingredient, onChange, onRemove }: Props) {
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function estimateMacros() {
    if (!ingredient.name.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/foods?q=${encodeURIComponent(ingredient.name.trim())}`);
      const data: FoodItem[] = await res.json();
      setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
      setShowSuggestions(true);
    } finally {
      setSearching(false);
    }
  }

  function applySuggestion(food: FoodItem) {
    onChange(ingredient.id, 'calories', String(Math.round(food.calories)));
    onChange(ingredient.id, 'protein', String(Math.round(food.protein * 10) / 10));
    onChange(ingredient.id, 'carbs', String(Math.round(food.carbs * 10) / 10));
    onChange(ingredient.id, 'fat', String(Math.round(food.fat * 10) / 10));
    setShowSuggestions(false);
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
      <div className="col-span-12 sm:col-span-3">
        <Input
          placeholder="Ingredient name"
          value={ingredient.name}
          onChange={(e) => onChange(ingredient.id, 'name', e.target.value)}
        />
        {ingredient.name.trim() && !showSuggestions && (
          <button
            type="button"
            onClick={estimateMacros}
            disabled={searching}
            className="mt-1 flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-70 transition-opacity disabled:opacity-40"
          >
            <Sparkles size={11} />
            {searching ? 'Searching…' : 'Estimate macros'}
          </button>
        )}
        {showSuggestions && (
          <div className="mt-1 rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-medium">Pick a match</span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No matches found.</p>
            ) : (
              suggestions.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => applySuggestion(food)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-2)] transition-colors text-left"
                >
                  <span className="text-xs text-[var(--text)] truncate">{food.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                    {food.calories} cal · {food.serving_label}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="col-span-4 sm:col-span-2">
        <Input
          type="number"
          placeholder="Amount"
          value={ingredient.amount}
          onChange={(e) => onChange(ingredient.id, 'amount', e.target.value)}
          min="0"
          step="0.1"
        />
      </div>
      <div className="col-span-4 sm:col-span-1">
        <select
          value={ingredient.unit}
          onChange={(e) => onChange(ingredient.id, 'unit', e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] transition-all"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="col-span-4 sm:col-span-1">
        <Input
          type="number"
          placeholder="Cal"
          value={ingredient.calories}
          onChange={(e) => onChange(ingredient.id, 'calories', e.target.value)}
          suffix="kcal"
          min="0"
        />
      </div>
      <div className="col-span-4 sm:col-span-1">
        <Input
          type="number"
          placeholder="Pro"
          value={ingredient.protein}
          onChange={(e) => onChange(ingredient.id, 'protein', e.target.value)}
          suffix="g"
          min="0"
        />
      </div>
      <div className="col-span-4 sm:col-span-1">
        <Input
          type="number"
          placeholder="Carb"
          value={ingredient.carbs}
          onChange={(e) => onChange(ingredient.id, 'carbs', e.target.value)}
          suffix="g"
          min="0"
        />
      </div>
      <div className="col-span-4 sm:col-span-1">
        <Input
          type="number"
          placeholder="Fat"
          value={ingredient.fat}
          onChange={(e) => onChange(ingredient.id, 'fat', e.target.value)}
          suffix="g"
          min="0"
        />
      </div>
      <div className="col-span-2 sm:col-span-1 flex justify-end pt-1">
        <button
          type="button"
          onClick={() => onRemove(ingredient.id)}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
