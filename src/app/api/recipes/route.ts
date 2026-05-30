import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(*)')
    .eq('user_id', user.id)
    .eq('is_quick_add', false)
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, default_servings, tags, ingredients, steps, prep_time, cook_time } = body;

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id, name, description,
      default_servings: default_servings ?? 1,
      tags,
      steps: steps ?? [],
      prep_time: prep_time ?? null,
      cook_time: cook_time ?? null,
    })
    .select()
    .single();

  if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });

  if (ingredients?.length) {
    const rows = ingredients.map((ing: Record<string, unknown>) => ({ ...ing, recipe_id: recipe.id }));
    const { error: ingError } = await supabase.from('ingredients').insert(rows);
    if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 });
  }

  const { data: full } = await supabase
    .from('recipes')
    .select('*, ingredients(*)')
    .eq('id', recipe.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
