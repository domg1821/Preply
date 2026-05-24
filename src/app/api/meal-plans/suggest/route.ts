import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recipeMacros(ingredients: any[]): { calories: number; protein: number; carbs: number; fat: number } {
  return (ingredients ?? []).reduce(
    (acc, ing) => {
      const factor = (ing.amount_per_serving ?? 0);
      return {
        calories: acc.calories + (ing.calories_per_unit ?? 0) * factor,
        protein: acc.protein + (ing.protein_per_unit ?? 0) * factor,
        carbs: acc.carbs + (ing.carbs_per_unit ?? 0) * factor,
        fat: acc.fat + (ing.fat_per_unit ?? 0) * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { preferences, weekStart } = await req.json();
  if (!weekStart) return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });

  // Fetch user's saved recipes with ingredients
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, name, default_servings, ingredients(*)')
    .eq('user_id', user.id)
    .eq('is_quick_add', false)
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!recipes || recipes.length === 0) {
    return NextResponse.json(
      { error: 'No recipes found. Add some recipes in the Recipes tab first.' },
      { status: 400 }
    );
  }

  // Build the recipe list with macro context for the prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipeLines = recipes.map((r: any) => {
    const m = recipeMacros(r.ingredients ?? []);
    const cal = Math.round(m.calories);
    const pro = Math.round(m.protein);
    const carb = Math.round(m.carbs);
    const fat = Math.round(m.fat);
    return `- ${r.name} (${cal} cal, ${pro}g protein, ${carb}g carbs, ${fat}g fat)`;
  });

  // Generate the 7 date strings for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateList = weekDates.join(', ');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: 'You are a meal planning assistant. Create 7-day meal plans using only the provided recipes. Respond with valid JSON only — no explanation, no markdown code blocks, no extra text. Output the raw JSON array directly.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Available recipes:\n${recipeLines.join('\n')}\n\nUser preferences: ${preferences?.trim() || 'None specified'}\n\nWeek dates (Monday to Sunday): ${dateList}\n\nCreate a meal plan with breakfast, lunch, and dinner for each of the 7 days (21 entries total).\n\nRules:\n- Use recipe names exactly as listed above\n- Vary meals — avoid repeating the same recipe more than twice per week\n- Distribute meals to match preferences if given\n- Include all 7 days\n\nReturn a JSON array:\n[{"date":"YYYY-MM-DD","meal_type":"breakfast","recipe_name":"exact name from list","servings":1}]`,
      },
    ],
  });

  const raw = response.content.find((b) => b.type === 'text')?.text ?? '';

  // Parse — strip accidental markdown fencing if present
  let parsed: { date: string; meal_type: string; recipe_name: string; servings: number }[];
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 });
    try { parsed = JSON.parse(match[0]); }
    catch { return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 }); }
  }

  if (!Array.isArray(parsed)) {
    return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 });
  }

  // Match recipe names → IDs (case-insensitive, then partial-match fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipeByName = new Map<string, any>(recipes.map((r: any) => [r.name.toLowerCase(), r]));

  const suggestions = parsed
    .filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s.meal_type))
    .map((s) => {
      const key = s.recipe_name?.toLowerCase().trim();
      const recipe =
        recipeByName.get(key) ??
        // Fallback: find any recipe whose name contains the suggested name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [...recipeByName.values()].find((r: any) => r.name.toLowerCase().includes(key ?? ''));
      if (!recipe) return null;
      return {
        date: s.date,
        meal_type: s.meal_type as 'breakfast' | 'lunch' | 'dinner',
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        servings: Number(s.servings) || 1,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ suggestions });
}
