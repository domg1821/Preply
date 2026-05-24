import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MacroInfo, Ingredient, MealPlanEntry } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcIngredientMacros(ingredient: Ingredient, servings: number): MacroInfo {
  const factor = ingredient.amount_per_serving * servings;
  return {
    calories: (ingredient.calories_per_unit ?? 0) * factor,
    protein: (ingredient.protein_per_unit ?? 0) * factor,
    carbs: (ingredient.carbs_per_unit ?? 0) * factor,
    fat: (ingredient.fat_per_unit ?? 0) * factor,
    fiber: (ingredient.fiber_per_unit ?? 0) * factor,
    sodium: (ingredient.sodium_per_unit ?? 0) * factor,
  };
}

export function calcRecipeMacros(ingredients: Ingredient[], servings: number): MacroInfo {
  return ingredients.reduce(
    (acc, ing) => {
      const m = calcIngredientMacros(ing, servings);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        fiber: (acc.fiber ?? 0) + (m.fiber ?? 0),
        sodium: (acc.sodium ?? 0) + (m.sodium ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

export function calcDayMacros(entries: MealPlanEntry[]): MacroInfo {
  return entries.reduce(
    (acc, entry) => {
      if (!entry.recipe) return acc;
      const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        fiber: (acc.fiber ?? 0) + (m.fiber ?? 0),
        sodium: (acc.sodium ?? 0) + (m.sodium ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

export function roundMacro(value: number, decimals = 1): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

// Walmart search URL
export function walmartSearchUrl(ingredient: string): string {
  return `https://www.walmart.com/search?q=${encodeURIComponent(ingredient)}`;
}

// Publix search URL
export function publixSearchUrl(ingredient: string): string {
  return `https://www.publix.com/search#q=${encodeURIComponent(ingredient)}&t=product`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
