import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
}

// GET /api/grocery?week_start=YYYY-MM-DD
// Returns { mealGroups, checkedItems } for the grocery checklist.
// Without week_start: legacy path — returns flat grocery_items list.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get('week_start');

  if (!weekStart) {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', user.id)
      .order('checked', { ascending: true })
      .order('name', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const weekEnd = addDays(weekStart, 6);

  const [mealPlansRes, checkedRes] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('id, date, meal_type, servings, recipe:recipes(name, ingredients(name, amount_per_serving, unit))')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date', { ascending: true }),
    supabase
      .from('grocery_checked_items')
      .select('meal_plan_id, ingredient_name')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('checked', true),
  ]);

  if (mealPlansRes.error) return NextResponse.json({ error: mealPlansRes.error.message }, { status: 500 });
  if (checkedRes.error) return NextResponse.json({ error: checkedRes.error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mealGroups = (mealPlansRes.data ?? []).map((mp: any) => ({
    meal_plan_id: mp.id,
    recipe_name: mp.recipe?.name ?? 'Unknown',
    meal_type: mp.meal_type,
    date: mp.date,
    ingredients: (mp.recipe?.ingredients ?? []).map((ing: any) => ({
      name: ing.name,
      amount: ing.amount_per_serving * mp.servings,
      unit: ing.unit,
    })),
  }));

  const checkedItems = (checkedRes.data ?? []).map(
    (row: any) => `${row.meal_plan_id}__${row.ingredient_name}`
  );

  return NextResponse.json({ mealGroups, checkedItems });
}

// POST /api/grocery
// Body { meal_plan_id, ingredient_name, checked, week_start } → upsert grocery_checked_items.
// Body { items[] } → legacy: add to grocery_items.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if ('meal_plan_id' in body) {
    const { meal_plan_id, ingredient_name, checked, week_start } = body;
    const { error } = await supabase
      .from('grocery_checked_items')
      .upsert(
        { user_id: user.id, week_start, meal_plan_id, ingredient_name, checked },
        { onConflict: 'user_id,week_start,meal_plan_id,ingredient_name' }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Legacy: add items to grocery_items
  const items: { name: string; amount: number; unit: string; source_recipe?: string }[] = body.items;

  const { data: existing } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('checked', false);

  const toInsert: typeof items = [];
  const toUpdate: { id: string; amount: number }[] = [];

  for (const item of items) {
    const match = existing?.find(
      (e) =>
        e.name.toLowerCase() === item.name.toLowerCase() &&
        e.unit === item.unit &&
        (e.source_recipe ?? null) === (item.source_recipe ?? null)
    );
    if (match) {
      toUpdate.push({ id: match.id, amount: match.amount + item.amount });
    } else {
      toInsert.push(item);
    }
  }

  const ops: PromiseLike<unknown>[] = [];
  if (toInsert.length) {
    ops.push(supabase.from('grocery_items').insert(toInsert.map((i) => ({ ...i, user_id: user.id }))).then());
  }
  for (const u of toUpdate) {
    ops.push(supabase.from('grocery_items').update({ amount: u.amount }).eq('id', u.id).then());
  }
  await Promise.all(ops);

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, checked } = await req.json();
  const { error } = await supabase
    .from('grocery_items')
    .update({ checked })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const clearChecked = searchParams.get('clear_checked');

  const clearWeek = searchParams.get('clear_week');

  if (clearWeek) {
    await supabase.from('grocery_checked_items').delete().eq('user_id', user.id).eq('week_start', clearWeek);
  } else if (clearChecked) {
    await supabase.from('grocery_items').delete().eq('user_id', user.id).eq('checked', true);
  } else if (id) {
    await supabase.from('grocery_items').delete().eq('id', id).eq('user_id', user.id);
  }

  return NextResponse.json({ success: true });
}
