'use client';
import { useState, useEffect } from 'react';
import { Plus, Sparkles, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IngredientRow, IngredientDraft } from './IngredientRow';
import { calcRecipeMacros } from '@/lib/utils';
import { Ingredient } from '@/types';
import { searchTemplates, RecipeTemplate } from '@/lib/recipe-templates';

interface Props {
  onSave: (data: {
    name: string;
    description: string;
    default_servings: number;
    tags: string[];
    ingredients: Omit<Ingredient, 'id'>[];
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function newIngredient(): IngredientDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: '1',
    unit: 'g',
    calories: '0',
    protein: '0',
    carbs: '0',
    fat: '0',
  };
}

function templateToDraft(t: RecipeTemplate): IngredientDraft[] {
  return t.ingredients.map((ing) => ({
    id: crypto.randomUUID(),
    name: ing.name,
    amount: String(ing.amount_per_serving),
    unit: ing.unit,
    calories: String(Math.round(ing.calories_per_unit * ing.amount_per_serving)),
    protein: String(Math.round(ing.protein_per_unit * ing.amount_per_serving * 10) / 10),
    carbs: String(Math.round(ing.carbs_per_unit * ing.amount_per_serving * 10) / 10),
    fat: String(Math.round(ing.fat_per_unit * ing.amount_per_serving * 10) / 10),
  }));
}

export function RecipeBuilder({ onSave, onCancel, saving }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('1');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([newIngredient()]);
  const [templateMatches, setTemplateMatches] = useState<RecipeTemplate[]>([]);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Search templates whenever the recipe name changes
  useEffect(() => {
    const matches = searchTemplates(name);
    setTemplateMatches(matches);
    if (matches.length > 0 && !appliedTemplate) {
      setShowTemplates(true);
    }
  }, [name, appliedTemplate]);

  function applyTemplate(template: RecipeTemplate) {
    setIngredients(templateToDraft(template));
    setServings(String(template.default_servings));
    if (!tags) setTags(template.tags.join(', '));
    setAppliedTemplate(template.name);
    setShowTemplates(false);
  }

  function handleIngredientChange(id: string, field: keyof IngredientDraft, value: string) {
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function handleRemove(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, newIngredient()]);
  }

  // Live macro preview — draft stores total-per-serving values; convert to per-unit for calcRecipeMacros
  const previewIngredients: Ingredient[] = ingredients
    .filter((i) => i.name && Number(i.amount) > 0)
    .map((i) => {
      const amount = Number(i.amount);
      return {
        id: i.id,
        name: i.name,
        amount_per_serving: amount,
        unit: i.unit,
        calories_per_unit: Number(i.calories) / amount,
        protein_per_unit: Number(i.protein) / amount,
        carbs_per_unit: Number(i.carbs) / amount,
        fat_per_unit: Number(i.fat) / amount,
      };
    });
  const preview = calcRecipeMacros(previewIngredients, 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      description: description.trim(),
      default_servings: Number(servings) || 1,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: previewIngredients.map(({ id: _id, ...rest }) => rest),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Recipe name"
          placeholder="e.g. Chicken Alfredo"
          value={name}
          onChange={(e) => { setName(e.target.value); setAppliedTemplate(null); }}
          required
        />
        <Input
          label="Default servings"
          type="number"
          min="0.5"
          step="0.5"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />
      </div>

      {/* Template auto-fill banner */}
      {showTemplates && templateMatches.length > 0 && (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--primary)]" />
              <span className="text-xs font-semibold text-[var(--primary)]">Auto-fill ingredients</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {templateMatches.slice(0, 3).map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.ingredients.length} ingredients · {t.default_servings} serving{t.default_servings !== 1 ? 's' : ''}
                    {' · '}{t.tags.slice(0, 2).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Fill <ChevronDown size={12} className="-rotate-90" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Applied template badge */}
      {appliedTemplate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs">
          <Check size={12} className="text-[var(--primary)]" />
          <span className="text-[var(--primary)] font-medium">Filled from template: {appliedTemplate}</span>
          <span className="text-[var(--text-muted)]">· Edit any amounts below</span>
        </div>
      )}

      <Input
        label="Description (optional)"
        placeholder="Quick, high-protein lunch..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Tags (comma-separated)"
        placeholder="high-protein, meal-prep, chicken"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Ingredients per serving</h3>
          <div className="hidden sm:grid grid-cols-6 gap-2 text-xs text-[var(--text-muted)] pr-10">
            <span>Amount</span>
            <span>Unit</span>
            <span>Cal</span>
            <span>Pro</span>
            <span>Carb</span>
            <span>Fat</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {ingredients.map((ing) => (
            <IngredientRow
              key={ing.id}
              ingredient={ing}
              onChange={handleIngredientChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
        >
          <Plus size={16} />
          Add ingredient
        </button>
      </div>

      {/* Macro preview */}
      {previewIngredients.length > 0 && (
        <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-3">Macros per serving</p>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Calories', value: Math.round(preview.calories), unit: 'kcal', color: 'text-amber-400' },
              { label: 'Protein', value: Math.round(preview.protein * 10) / 10, unit: 'g', color: 'text-[var(--primary)]' },
              { label: 'Carbs', value: Math.round(preview.carbs * 10) / 10, unit: 'g', color: 'text-blue-400' },
              { label: 'Fat', value: Math.round(preview.fat * 10) / 10, unit: 'g', color: 'text-purple-400' },
            ].map(({ label, value, unit, color }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${color}`}>{value}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Recipe</Button>
      </div>
    </form>
  );
}
