export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MacroInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount_per_serving: number;
  unit: string;
  // Flat columns matching the DB schema (calories_per_unit * amount_per_serving = macros per serving)
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
  fiber_per_unit?: number;
  sodium_per_unit?: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  default_servings: number;
  image_url?: string;
  tags?: string[];
  ingredients: Ingredient[];
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id?: string;
  user_id?: string;
  date: string;
  water_glasses: number;
  notes?: string;
}

export interface MealPlanEntry {
  id: string;
  user_id: string;
  date: string; // ISO date string YYYY-MM-DD
  meal_type: MealType;
  recipe_id: string;
  recipe?: Recipe;
  servings: number;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  source_recipe?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_premium: boolean;
  stripe_customer_id?: string;
  macro_goals?: MacroInfo;
  dietary_restrictions?: string[];
  created_at: string;
}

export interface DayMacros {
  date: string;
  totals: MacroInfo;
  meals: {
    meal_type: MealType;
    macros: MacroInfo;
    recipe_name: string;
    servings: number;
  }[];
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  serving_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface WeekMacros {
  week_start: string;
  days: DayMacros[];
  weekly_totals: MacroInfo;
}
