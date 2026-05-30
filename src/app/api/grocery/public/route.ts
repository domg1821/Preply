import { NextRequest, NextResponse } from 'next/server';
import { createAdminClientDirect } from '@/lib/supabase/server';

// Public endpoint — no auth needed, uses service role to read another user's grocery list.
// GET /api/grocery/public?user_id=xxx&week_start=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const weekStart = searchParams.get('week_start');

  if (!userId || !weekStart) {
    return NextResponse.json({ error: 'Missing user_id or week_start' }, { status: 400 });
  }

  const supabase = createAdminClientDirect();

  const [y, m, d] = weekStart.split('-').map(Number);
  const weekEnd = new Date(y, m - 1, d + 6);
  const weekEndStr = [
    weekEnd.getFullYear(),
    String(weekEnd.getMonth() + 1).padStart(2, '0'),
    String(weekEnd.getDate()).padStart(2, '0'),
  ].join('-');

  const [mealPlansRes, checkedRes] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('id, date, meal_type, servings, recipe:recipes(name, ingredients(name, amount_per_serving, unit))')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEndStr)
      .order('date', { ascending: true }),
    supabase
      .from('grocery_checked_items')
      .select('meal_plan_id, ingredient_name')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('checked', true),
  ]);

  if (mealPlansRes.error) {
    return NextResponse.json({ error: mealPlansRes.error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mealGroups = (mealPlansRes.data ?? []).map((mp: any) => ({
    meal_plan_id: mp.id,
    recipe_name: mp.recipe?.name ?? 'Unknown',
    meal_type: mp.meal_type,
    date: mp.date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ingredients: (mp.recipe?.ingredients ?? []).map((ing: any) => ({
      name: ing.name,
      amount: ing.amount_per_serving * mp.servings,
      unit: ing.unit,
    })),
  }));

  const checkedItems = checkedRes.error ? [] : (checkedRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => `${row.meal_plan_id}__${row.ingredient_name}`
  );

  return NextResponse.json({ mealGroups, checkedItems });
}
