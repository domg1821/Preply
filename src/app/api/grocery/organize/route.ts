import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ingredients } = await req.json();
  if (!ingredients || typeof ingredients !== 'string') {
    return NextResponse.json({ error: 'ingredients must be a non-empty string' }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are a grocery shopping assistant. Your job is to take a raw list of ingredients from a meal plan and organize them into a clean, easy-to-use grocery shopping list.

Group ingredients by store section (e.g., Produce, Meat & Seafood, Dairy & Eggs, Pantry / Dry Goods, Frozen, Bakery, Beverages, Other). Combine duplicate ingredients and sum their quantities when units match. Use clear, concise formatting with section headers followed by bullet points. Keep amounts and units. Drop any redundant notes. Output only the organized list — no preamble, no closing remarks.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: ingredients }],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  return NextResponse.json({ organized: text });
}
