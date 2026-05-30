'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Flame, Users, Minus, Plus, Check } from 'lucide-react';
import { Recipe } from '@/types';

interface Props {
  recipe: Recipe;
  defaultServings?: number;
  onClose: () => void;
}

function formatAmt(n: number): string {
  if (n === 0) return '0';
  if (n % 1 === 0) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

export function CookModeModal({ recipe, defaultServings, onClose }: Props) {
  const [servings, setServings] = useState(defaultServings ?? recipe.default_servings ?? 1);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(true);

  const scale = servings / (recipe.default_servings || 1);
  const steps = recipe.steps ?? [];
  const hasSteps = steps.length > 0;
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  function toggleStep(i: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      toggleStep(currentStep);
      setCurrentStep(s => s + 1);
    }
  }
  function prevStep() { if (currentStep > 0) setCurrentStep(s => s - 1); }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-lg max-h-[95vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{ background: 'var(--surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-bold text-[var(--text)] truncate">{recipe.name}</h2>
            </div>
            {totalTime > 0 && (
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                {recipe.prep_time ? (
                  <span className="flex items-center gap-1"><Clock size={11} /> {recipe.prep_time}m prep</span>
                ) : null}
                {recipe.cook_time ? (
                  <span className="flex items-center gap-1"><Flame size={11} className="text-orange-400" /> {recipe.cook_time}m cook</span>
                ) : null}
                {totalTime > 0 && <span className="text-[var(--primary)] font-semibold">{totalTime}m total</span>}
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="ml-3 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Serving scaler */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] shrink-0"
          style={{ background: 'var(--surface-2)' }}>
          <Users size={14} className="text-[var(--primary)] shrink-0" />
          <span className="text-sm font-medium text-[var(--text)] flex-1">Servings</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setServings(s => Math.max(0.5, s - (s > 1 ? 1 : 0.5)))}
              className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] flex items-center justify-center transition-all">
              <Minus size={12} />
            </button>
            <span className="text-sm font-bold text-[var(--text)] w-8 text-center">{servings}</span>
            <button onClick={() => setServings(s => s + (s >= 1 ? 1 : 0.5))}
              className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] flex items-center justify-center transition-all">
              <Plus size={12} />
            </button>
            {scale !== 1 && (
              <span className="text-xs text-[var(--primary)] font-semibold ml-1">×{parseFloat(scale.toFixed(2))}</span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => setShowIngredients(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
              >
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                  Ingredients ({recipe.ingredients.length})
                  {scale !== 1 && <span className="text-[var(--primary)] ml-1">· scaled for {servings} servings</span>}
                </span>
                <ChevronRight size={14} className={`text-[var(--text-muted)] transition-transform ${showIngredients ? 'rotate-90' : ''}`} />
              </button>
              {showIngredients && (
                <div className="px-5 pb-3 grid grid-cols-1 gap-1">
                  {recipe.ingredients.map((ing, i) => {
                    const scaled = ing.amount_per_serving * scale;
                    return (
                      <div key={ing.id ?? i}
                        className="flex items-center justify-between py-2 border-b border-[var(--border)]/40 last:border-0">
                        <span className="text-sm font-medium text-[var(--text)]">{ing.name}</span>
                        <span className="text-sm text-[var(--text-muted)] shrink-0 ml-4 tabular-nums">
                          {formatAmt(scaled)} {ing.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          {hasSteps ? (
            <div className="px-5 py-4">
              {/* Step dots */}
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setCurrentStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentStep ? 'scale-125' : ''
                    }`}
                    style={{
                      background: completedSteps.has(i)
                        ? 'var(--primary)'
                        : i === currentStep
                          ? '#fff'
                          : 'var(--border-2)',
                    }}
                  />
                ))}
                <span className="text-xs text-[var(--text-muted)] ml-1">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>

              {/* Current step card */}
              <div className="rounded-2xl border p-5 mb-4 min-h-[120px] flex flex-col justify-between"
                style={{
                  background: completedSteps.has(currentStep) ? 'rgba(16,185,129,0.06)' : 'var(--surface-2)',
                  borderColor: completedSteps.has(currentStep) ? 'rgba(16,185,129,0.25)' : 'var(--border)',
                }}>
                <p className="text-[15px] text-[var(--text)] leading-relaxed flex-1">
                  {steps[currentStep]}
                </p>
                <button
                  onClick={() => toggleStep(currentStep)}
                  className="mt-4 self-start flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  style={completedSteps.has(currentStep)
                    ? { background: 'rgba(16,185,129,0.15)', color: 'var(--primary)' }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <Check size={14} />
                  {completedSteps.has(currentStep) ? 'Done' : 'Mark done'}
                </button>
              </div>

              {/* Step navigation */}
              <div className="flex items-center gap-3">
                <button onClick={prevStep} disabled={currentStep === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-30 transition-all">
                  <ChevronLeft size={16} /> Prev
                </button>
                {currentStep < steps.length - 1 ? (
                  <button onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
                    <Check size={16} /> Done!
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No steps added for this recipe yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">Edit the recipe to add cooking instructions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
