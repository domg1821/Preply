'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, ShoppingCart, RefreshCw, Download, ClipboardCopy, Sparkles, Trash2, X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getMondayOfWeek } from '@/lib/utils';

interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
}

interface MealGroup {
  meal_plan_id: string;
  recipe_name: string;
  meal_type: string;
  date: string;
  ingredients: IngredientItem[];
}

interface NeedToBuyItem {
  name: string;
  amount: number;
  unit: string;
  mealCount: number;
  sameUnit: boolean;
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
};

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
}

function getDayLabel(dateStr: string, mealType: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  const meal = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  return `${day} – ${meal}`;
}

function formatAmount(amount: number): string {
  if (amount % 1 === 0) return String(amount);
  return parseFloat(amount.toFixed(2)).toString();
}

function buildExportText(groups: MealGroup[]): string {
  return groups
    .map((g) => {
      const lines = g.ingredients
        .map((ing) => `  - ${ing.name || 'Unknown ingredient'} — ${formatAmount(ing.amount)} ${ing.unit}`)
        .join('\n');
      return `${g.recipe_name} (${getDayLabel(g.date, g.meal_type)})\n${lines}`;
    })
    .join('\n\n');
}

function buildNeedToBuy(groups: MealGroup[], checkedKeys: Set<string>): NeedToBuyItem[] {
  const map = new Map<string, NeedToBuyItem & { sameUnit: boolean }>();
  for (const group of groups) {
    for (const ing of group.ingredients) {
      if (checkedKeys.has(`${group.meal_plan_id}__${ing.name}`)) continue;
      const normKey = (ing.name || 'unknown ingredient').toLowerCase().trim();
      const existing = map.get(normKey);
      if (existing) {
        existing.mealCount += 1;
        if (existing.unit === ing.unit) {
          existing.amount += ing.amount;
        } else {
          existing.sameUnit = false;
        }
      } else {
        map.set(normKey, { name: ing.name, amount: ing.amount, unit: ing.unit, mealCount: 1, sameUnit: true });
      }
    }
  }
  return Array.from(map.values());
}

async function triggerHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Silently fails on web / when Capacitor plugin is unavailable
  }
}

export default function GroceryPage() {
  const monday = getMondayOfWeek(new Date());
  const weekStart = toDateStr(monday);

  const [mealGroups, setMealGroups] = useState<MealGroup[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchData = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/grocery?week_start=${weekStart}`);
      const data = await res.json();
      if (data && !data.error) {
        setMealGroups(data.mealGroups ?? []);
        setCheckedKeys(new Set(data.checkedItems ?? []));
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function toggleCheck(meal_plan_id: string, ingredient_name: string) {
    const key = `${meal_plan_id}__${ingredient_name}`;
    const nowChecked = !checkedKeys.has(key);
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      nowChecked ? next.add(key) : next.delete(key);
      return next;
    });
    await triggerHaptic();
    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_plan_id, ingredient_name, checked: nowChecked, week_start: weekStart }),
    });
  }

  async function clearAllChecks() {
    if (!window.confirm('Clear all checked items for this week?')) return;
    setClearing(true);
    await fetch(`/api/grocery?clear_week=${weekStart}`, { method: 'DELETE' });
    setCheckedKeys(new Set());
    setClearing(false);
  }

  const needToBuy = buildNeedToBuy(mealGroups, checkedKeys);
  const checkedCount = checkedKeys.size;

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        <div className="h-5 w-32 rounded-lg bg-[var(--surface)] animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Page header */}
      <div className="flex items-start justify-between px-4 pt-4 md:px-6 md:pt-6 mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Grocery List</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{formatWeekLabel(monday)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} loading={syncing}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Sync from Calendar</span>
            <span className="sm:hidden">Sync</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExport(true)}
            disabled={mealGroups.length === 0}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export List</span>
          </Button>
        </div>
      </div>

      {/* Sticky "Need to Buy" banner */}
      {mealGroups.length > 0 && (
        <div className="sticky top-0 z-20 px-4 md:px-6 py-2 border-b border-[var(--border)]"
          style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-[var(--primary)]" />
              <span className="text-sm font-semibold text-[var(--text)]">
                {needToBuy.length === 0
                  ? 'All items checked ✓'
                  : `${needToBuy.length} item${needToBuy.length !== 1 ? 's' : ''} to buy`}
              </span>
              {checkedCount > 0 && (
                <span className="text-xs text-[var(--text-muted)]">· {checkedCount} checked</span>
              )}
            </div>
            {checkedCount > 0 && (
              <button
                onClick={clearAllChecks}
                disabled={clearing}
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={12} />
                Clear checks
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 md:px-6 pt-3">
        {mealGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {mealGroups.map((group) => (
              <MealCard
                key={group.meal_plan_id}
                group={group}
                checkedKeys={checkedKeys}
                isCollapsed={collapsed.has(group.meal_plan_id)}
                onToggleCollapse={() => toggleCollapse(group.meal_plan_id)}
                onToggleCheck={toggleCheck}
              />
            ))}

            {needToBuy.length > 0 && (
              <NeedToBuySection items={needToBuy} />
            )}
          </div>
        )}
      </div>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        exportText={buildExportText(mealGroups)}
      />
    </div>
  );
}

function MealCard({
  group,
  checkedKeys,
  isCollapsed,
  onToggleCollapse,
  onToggleCheck,
}: {
  group: MealGroup;
  checkedKeys: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleCheck: (meal_plan_id: string, ingredient_name: string) => void;
}) {
  const emoji = MEAL_EMOJI[group.meal_type] ?? '🍽️';
  const total = group.ingredients.length;
  const checkedCount = group.ingredients.filter(
    (ing) => checkedKeys.has(`${group.meal_plan_id}__${ing.name}`)
  ).length;
  const unchecked = total - checkedCount;
  const allDone = unchecked === 0 && total > 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Tap-friendly header — min 48px */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-4 hover:bg-[var(--surface-2)] transition-colors text-left"
        style={{ minHeight: '48px' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 py-2">
          <span className="text-lg shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">
              {group.recipe_name}
              <span className="text-[var(--text-muted)] font-normal mx-1.5">·</span>
              <span className="text-[var(--text-muted)] font-normal">{getDayLabel(group.date, group.meal_type)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3 py-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            allDone
              ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
          }`}>
            {allDone ? '✓ All done' : `${unchecked} / ${total} needed`}
          </span>
          {isCollapsed
            ? <ChevronDown size={16} className="text-[var(--text-muted)]" />
            : <ChevronUp size={16} className="text-[var(--text-muted)]" />
          }
        </div>
      </button>

      {!isCollapsed && total > 0 && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {group.ingredients.map((ing) => {
            const key = `${group.meal_plan_id}__${ing.name}`;
            const isChecked = checkedKeys.has(key);
            return (
              // Full-row tap target covering the entire ingredient row
              <button
                key={ing.name}
                onClick={() => onToggleCheck(group.meal_plan_id, ing.name)}
                className={`w-full flex items-center gap-3 px-4 text-left transition-colors ${
                  isChecked ? 'opacity-50' : 'hover:bg-[var(--surface-2)] active:bg-[var(--surface-2)]'
                }`}
                style={{ minHeight: '48px' }}
              >
                {/* Checkbox — 24×24px */}
                <span
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isChecked
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border-2)]'
                  }`}
                >
                  {isChecked && <Check size={13} className="text-white" />}
                </span>
                <span className={`flex-1 text-sm font-medium ${
                  isChecked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                }`}>
                  {ing.name || 'Unknown ingredient'}
                  <span className="text-[var(--text-muted)] font-normal mx-1">—</span>
                  <span className="text-[var(--text-muted)] font-normal tabular-nums">
                    {formatAmount(ing.amount)} {ing.unit}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!isCollapsed && total === 0 && (
        <p className="px-4 py-3 text-sm text-[var(--text-muted)] border-t border-[var(--border)]">
          No ingredients recorded for this recipe.
        </p>
      )}
    </div>
  );
}

function NeedToBuySection({ items }: { items: NeedToBuyItem[] }) {
  return (
    <div className="mt-2">
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <div key={item.name.toLowerCase()} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors">
              <span className="text-sm text-[var(--text)] font-medium">{item.name || 'Unknown ingredient'}</span>
              <div className="flex items-center gap-2">
                {item.mealCount > 1 && (
                  <span className="text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">
                    × {item.mealCount} meals
                  </span>
                )}
                {item.sameUnit && item.amount > 0 && (
                  <span className="text-sm text-[var(--text-muted)] tabular-nums">
                    {formatAmount(item.amount)} <span className="text-xs">{item.unit}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
        <ShoppingCart size={24} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-[var(--text-muted)] text-sm font-medium">No meals planned this week.</p>
      <p className="text-xs text-[var(--text-muted)] max-w-xs">
        Add meals to your calendar then hit <strong className="text-[var(--text-dim)]">Sync from Calendar</strong> to generate your grocery list.
      </p>
    </div>
  );
}

// ─── Export — bottom sheet on mobile, centered modal on desktop ─────────────

function ExportModal({
  open,
  onClose,
  exportText,
}: {
  open: boolean;
  onClose: () => void;
  exportText: string;
}) {
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAiOrganize() {
    setAiLoading(true);
    setAiResult('');
    setAiError('');
    try {
      const res = await fetch('/api/grocery/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: exportText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data.organized);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAiLoading(false);
    }
  }

  const body = (
    <div className="flex flex-col gap-3">
      {/* Copy to clipboard */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCopy size={16} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Copy to Clipboard</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">Plain text grouped by meal — paste anywhere.</p>
        <textarea
          readOnly
          value={exportText}
          rows={5}
          className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] px-3 py-2 resize-none outline-none mb-2 font-mono"
        />
        <Button variant="primary" size="sm" onClick={() => handleCopy(exportText)} className="w-full justify-center">
          {copied ? '✓ Copied!' : 'Copy List'}
        </Button>
      </div>

      {/* Walmart */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🛒</span>
          <span className="text-sm font-semibold text-[var(--text)]">Open Walmart</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">Copy your list above, then paste it into a Walmart grocery list.</p>
        <textarea
          readOnly
          value={exportText}
          rows={3}
          className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] px-3 py-2 resize-none outline-none mb-2 font-mono"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('https://www.walmart.com/lists', '_blank', 'noopener,noreferrer')}
          className="w-full justify-center"
        >
          Go to Walmart →
        </Button>
      </div>

      {/* Publix */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🌿</span>
          <span className="text-sm font-semibold text-[var(--text)]">Open Publix</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Publix does not support direct import. Copy your list and use it as a reference while you shop.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('https://www.publix.com/savings/digital-coupons', '_blank', 'noopener,noreferrer')}
          className="w-full justify-center"
        >
          Go to Publix →
        </Button>
      </div>

      {/* AI organize */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Organize with AI</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Claude will group your ingredients by store section and combine duplicates.
        </p>
        {aiError && <p className="text-xs text-red-500 mb-2">{aiError}</p>}
        {aiResult ? (
          <>
            <textarea
              readOnly
              value={aiResult}
              rows={8}
              className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] px-3 py-2 resize-none outline-none mb-2 font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCopy(aiResult)}
                className="flex-1 justify-center"
              >
                {copied ? '✓ Copied!' : 'Copy Organized List'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAiOrganize} loading={aiLoading}>
                Redo
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAiOrganize}
            loading={aiLoading}
            className="w-full justify-center"
          >
            <Sparkles size={13} />
            {aiLoading ? 'Organizing…' : 'Use AI to organize my list'}
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile: slide-up bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        />
        {/* Sheet */}
        <div
          className={`fixed bottom-0 inset-x-0 z-50 rounded-t-3xl transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ background: 'var(--surface)', maxHeight: '90dvh' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-2)' }} />
          </div>
          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--text)]">Export Shopping List</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]"
            >
              <X size={16} />
            </button>
          </div>
          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-4">
            {body}
          </div>
        </div>
      </>
    );
  }

  // Desktop: centered modal
  return (
    <Modal open={open} onClose={onClose} title="Export Your Shopping List" size="md">
      <div className="pt-1">
        {body}
      </div>
    </Modal>
  );
}
