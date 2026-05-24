'use client';
import { useState } from 'react';
import { ChefHat, Target, Droplets, CalendarDays, BookOpen, ShoppingCart, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

const DIETARY_OPTIONS = [
  'None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo',
  'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein', 'Mediterranean',
];

const FEATURES = [
  { icon: CalendarDays, color: 'text-[var(--primary)]', bg: 'bg-emerald-500/10', title: 'Plan Your Week', desc: 'Drop meals onto your weekly calendar and see macros at a glance.' },
  { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Build Recipes', desc: 'Save any recipe with per-serving ingredients. Scale to any serving count.' },
  { icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Smart Grocery List', desc: 'Auto-generate a list from your week. Link items straight to Walmart or Publix.' },
  { icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Hit Your Macros', desc: 'Set calorie & macro goals. Track progress with visual rings every day.' },
];

interface Props {
  userName?: string;
  onComplete: () => void;
}

export function OnboardingModal({ userName, onComplete }: Props) {
  const [step, setStep] = useState(0); // 0=welcome, 1=goals, 2=diet, 3=done
  const [saving, setSaving] = useState(false);
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('150');
  const [carbs, setCarbs] = useState('200');
  const [fat, setFat] = useState('65');
  const [selectedDiet, setSelectedDiet] = useState<string[]>(['None']);

  function toggleDiet(option: string) {
    if (option === 'None') {
      setSelectedDiet(['None']);
      return;
    }
    setSelectedDiet((prev) => {
      const without = prev.filter((d) => d !== 'None');
      return without.includes(option) ? without.filter((d) => d !== option) : [...without, option];
    });
  }

  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        macro_goals: {
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
        },
        dietary_restrictions: selectedDiet.filter((d) => d !== 'None'),
        onboarding_completed: true,
      }).eq('id', user.id);
    }
    setSaving(false);
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: 'var(--surface)' }}>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-5 pb-1">
          {[0,1,2,3].map((i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === step ? 20 : 6, background: i <= step ? 'var(--primary)' : 'var(--border-2)' }} />
          ))}
        </div>

        <div className="p-6">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center glow-primary"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <ChefHat size={30} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text)] mb-1">
                  Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Preply helps you plan meals, hit your macros, and shop smarter. Here&apos;s a quick look at what you can do.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2.5 mt-1">
                {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 text-left p-3 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-2" size="lg" onClick={() => setStep(1)}>
                Let&apos;s set your goals <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 1 — Macro goals */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={18} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold text-[var(--text)]">Daily Goals</h2>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Set your targets — you can always adjust these in Settings.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} suffix="kcal" min="0" />
                <Input label="Protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} suffix="g" min="0" />
                <Input label="Carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} suffix="g" min="0" />
                <Input label="Fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} suffix="g" min="0" />
              </div>
              {/* Quick presets */}
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Quick presets</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Maintenance', cal: 2000, pro: 150, carb: 200, fat: 65 },
                    { label: 'Cut', cal: 1600, pro: 170, carb: 130, fat: 55 },
                    { label: 'Bulk', cal: 2800, pro: 180, carb: 320, fat: 80 },
                  ].map((p) => (
                    <button key={p.label} onClick={() => { setCalories(String(p.cal)); setProtein(String(p.pro)); setCarbs(String(p.carb)); setFat(String(p.fat)); }}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(2)} className="flex-1">Next <ChevronRight size={14} /></Button>
              </div>
            </div>
          )}

          {/* Step 2 — Dietary prefs */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">Dietary Preferences</h2>
                <p className="text-sm text-[var(--text-muted)]">We&apos;ll use this to personalise suggestions. Select all that apply.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => {
                  const active = selectedDiet.includes(opt);
                  return (
                    <button key={opt} onClick={() => toggleDiet(opt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: active ? 'rgba(16,185,129,0.15)' : 'var(--surface-2)',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        color: active ? 'var(--primary)' : 'var(--text-dim)',
                      }}
                    >
                      {active && <Check size={12} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button loading={saving} onClick={handleFinish} className="flex-1">
                  {saving ? 'Saving…' : "Let's go! 🚀"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
