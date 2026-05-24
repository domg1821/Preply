import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Adds a food database item directly to a meal plan entry.
// Creates a hidden "quick-add" recipe so the meal plan schema stays intact.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { food_id, date, meal_type, servings } = await req.json();

  // Fetch the food item
  const { data: food, error: foodErr } = await supabase
    .from('food_database')
    .select('*')
    .eq('id', food_id)
    .single();

  if (foodErr || !food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  // Check if user already has a quick-add recipe for this exact food
  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', food.name)
    .eq('is_quick_add', true)
    .maybeSingle();

  let recipeId: string;

  if (existing) {
    recipeId = existing.id;
  } else {
    // Create a quick-add recipe with one ingredient
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        name: food.name,
        description: `${food.serving_label} · ${food.category}`,
        default_servings: 1,
        tags: [food.category.toLowerCase()],
        is_quick_add: true,
      })
      .select()
      .single();

    if (recipeErr || !recipe) return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });

    // Macros are stored per-unit where 1 unit = 1 serving of this food
    await supabase.from('ingredients').insert({
      recipe_id: recipe.id,
      name: food.name,
      amount_per_serving: 1,
      unit: 'serving',
      calories_per_unit: food.calories,
      protein_per_unit: food.protein,
      carbs_per_unit: food.carbs,
      fat_per_unit: food.fat,
      fiber_per_unit: food.fiber,
    });

    recipeId = recipe.id;
  }

  // Add to meal plan
  const { data: entry, error: entryErr } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, date, meal_type, recipe_id: recipeId, servings })
    .select('*, recipe:recipes(*, ingredients(*))')
    .single();

  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 });
  return NextResponse.json(entry, { status: 201 });
}
