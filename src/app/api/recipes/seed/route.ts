import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RECIPE_TEMPLATES } from '@/lib/recipe-templates';

// POST /api/recipes/seed
// Bulk-saves all recipe templates into the user's recipes table.
// Skips any recipe whose name already exists for this user (case-insensitive).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch names the user already has
  const { data: existing } = await supabase
    .from('recipes')
    .select('name')
    .eq('user_id', user.id)
    .eq('is_quick_add', false);

  const existingNames = new Set(
    (existing ?? []).map((r: { name: string }) => r.name.toLowerCase().trim())
  );

  const toAdd = RECIPE_TEMPLATES.filter(
    (t) => !existingNames.has(t.name.toLowerCase().trim())
  );

  let added = 0;
  for (const template of toAdd) {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        name: template.name,
        description: template.tags.slice(0, 3).join(', '),
        default_servings: template.default_servings,
        tags: template.tags,
      })
      .select('id')
      .single();

    if (recipeError || !recipe) continue;

    const ingredientRows = template.ingredients.map((ing) => ({
      recipe_id: recipe.id,
      name: ing.name,
      amount_per_serving: ing.amount_per_serving,
      unit: ing.unit,
      calories_per_unit: ing.calories_per_unit,
      protein_per_unit: ing.protein_per_unit,
      carbs_per_unit: ing.carbs_per_unit,
      fat_per_unit: ing.fat_per_unit,
    }));

    if (ingredientRows.length > 0) {
      await supabase.from('ingredients').insert(ingredientRows);
    }

    added++;
  }

  return NextResponse.json({ added, skipped: toAdd.length === 0 ? existing?.length ?? 0 : RECIPE_TEMPLATES.length - toAdd.length });
}
