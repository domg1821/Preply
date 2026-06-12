'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Check, ShoppingCart, RefreshCw, Printer,
  Sparkles, Trash2, X, Plus, Minus, Users, List, LayoutList,
  ClipboardCopy, ExternalLink, Share2, Home, DollarSign, PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getMondayOfWeek } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { openUrl, copyToClipboard, triggerHaptic, getAppUrl } from '@/lib/capacitor';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IngredientItem { name: string; amount: number; unit: string; }
interface MealGroup {
  meal_plan_id: string;
  recipe_name: string;
  meal_type: string;
  date: string;
  ingredients: IngredientItem[];
}
interface CombinedItem {
  name: string;
  totalAmount: number;
  unit: string;
  sameUnit: boolean;
  mealCount: number;
  sources: Array<{ meal_plan_id: string; ingredient_name: string }>;
}
interface ManualItem { id: string; name: string; amount: string; unit: string; checked: boolean; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MEAL_EMOJI: Record<string, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' };

function toDateStr(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
}
function getDayLabel(dateStr: string, mealType: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${date.toLocaleDateString('en-US', { weekday: 'short' })} – ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
}
function formatAmt(n: number): string {
  if (n % 1 === 0) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

function buildCombined(groups: MealGroup[], checkedKeys: Set<string>, people: number): CombinedItem[] {
  const map = new Map<string, CombinedItem>();
  for (const g of groups) {
    for (const ing of g.ingredients) {
      const norm = (ing.name || 'unknown').toLowerCase().trim();
      const existing = map.get(norm);
      const source = { meal_plan_id: g.meal_plan_id, ingredient_name: ing.name };
      if (existing) {
        existing.mealCount += 1;
        existing.sources.push(source);
        if (existing.unit === ing.unit) existing.totalAmount += ing.amount * people;
        else existing.sameUnit = false;
      } else {
        map.set(norm, {
          name: ing.name, totalAmount: ing.amount * people, unit: ing.unit,
          sameUnit: true, mealCount: 1, sources: [source],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildExportText(groups: MealGroup[], manualItems: ManualItem[], people: number): string {
  const lines: string[] = [];
  for (const g of groups) {
    lines.push(`${g.recipe_name} (${getDayLabel(g.date, g.meal_type)})`);
    for (const ing of g.ingredients) {
      lines.push(`  - ${ing.name} — ${formatAmt(ing.amount * people)} ${ing.unit}`);
    }
    lines.push('');
  }
  if (manualItems.length > 0) {
    lines.push('Additional Items');
    for (const item of manualItems) {
      lines.push(`  - ${item.name}${item.amount ? ` — ${item.amount} ${item.unit}` : ''}`);
    }
  }
  return lines.join('\n').trim();
}

function buildInstacartUrl(combined: CombinedItem[], manualItems: ManualItem[]): string {
  const allItems = [
    ...combined.map(i => i.name),
    ...manualItems.map(i => i.name),
  ].slice(0, 20); // Instacart search handles ~20 items well
  const query = allItems.join(', ');
  return `https://www.instacart.com/store/search_v3/term?term=${encodeURIComponent(query)}`;
}

const MANUAL_KEY = (weekStart: string) => `preply_manual_${weekStart}`;
const PANTRY_KEY = 'preply_pantry';
const COSTS_KEY = 'preply_costs';

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function GroceryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    }>
      <GroceryContent />
    </Suspense>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function GroceryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramWeekStart = searchParams.get('week_start');
  const monday = paramWeekStart
    ? (() => { const [y, m, d] = paramWeekStart.split('-').map(Number); return new Date(y, m - 1, d); })()
    : getMondayOfWeek(new Date());
  const weekStart = toDateStr(monday);

  function shiftWeek(delta: number) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + delta * 7);
    router.push(`/grocery?week_start=${toDateStr(next)}`);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [mealGroups, setMealGroups] = useState<MealGroup[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<'ingredient' | 'meal'>('ingredient');
  const [people, setPeople] = useState(1);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [pantry, setPantryState] = useState<Record<string, boolean>>({});
  const [costs, setCostsState] = useState<Record<string, number>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Load share URL ────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('id').eq('id', user.id).single().then(({ data }) => {
        if (data?.id) {
          const base = getAppUrl() || window.location.origin;
          setShareUrl(`${base}/grocery/shared/${data.id}/${weekStart}`);
        }
      });
    });
  }, [weekStart]);

  // ── Load manual items from localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MANUAL_KEY(weekStart));
      setManualItems(saved ? JSON.parse(saved) : []);
    } catch { setManualItems([]); }
  }, [weekStart]);

  function saveManual(items: ManualItem[]) {
    setManualItems(items);
    try { localStorage.setItem(MANUAL_KEY(weekStart), JSON.stringify(items)); } catch { /* ignore */ }
  }

  // ── Load pantry + costs from localStorage ────────────────────────────────
  useEffect(() => {
    try {
      const p = localStorage.getItem(PANTRY_KEY);
      if (p) setPantryState(JSON.parse(p));
      const c = localStorage.getItem(COSTS_KEY);
      if (c) setCostsState(JSON.parse(c));
    } catch { /* ignore */ }
  }, []);

  function togglePantry(name: string) {
    setPantryState(prev => {
      const next = { ...prev, [name.toLowerCase()]: !prev[name.toLowerCase()] };
      try { localStorage.setItem(PANTRY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function setItemCost(name: string, cost: number | null) {
    setCostsState(prev => {
      const next = { ...prev };
      if (cost === null) delete next[name.toLowerCase()];
      else next[name.toLowerCase()] = cost;
      try { localStorage.setItem(COSTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  // ── Fetch grocery data ────────────────────────────────────────────────────
  const fetchData = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true); else setLoading(true);
    try {
      const res = await fetch(`/api/grocery?week_start=${weekStart}`);
      const data = await res.json();
      if (data && !data.error) {
        setMealGroups(data.mealGroups ?? []);
        setCheckedKeys(new Set(data.checkedItems ?? []));
      }
    } finally { setLoading(false); setSyncing(false); }
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Check ingredient (marks all sources) ─────────────────────────────────
  async function toggleCombinedItem(item: CombinedItem) {
    const allChecked = item.sources.every(s => checkedKeys.has(`${s.meal_plan_id}__${s.ingredient_name}`));
    const newChecked = !allChecked;

    setCheckedKeys(prev => {
      const next = new Set(prev);
      for (const s of item.sources) {
        const key = `${s.meal_plan_id}__${s.ingredient_name}`;
        newChecked ? next.add(key) : next.delete(key);
      }
      return next;
    });

    await triggerHaptic();
    // Persist each source
    await Promise.all(item.sources.map(s =>
      fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_plan_id: s.meal_plan_id, ingredient_name: s.ingredient_name, checked: newChecked, week_start: weekStart }),
      })
    ));
  }

  // ── Check single meal ingredient ──────────────────────────────────────────
  async function toggleMealItem(meal_plan_id: string, ingredient_name: string) {
    const key = `${meal_plan_id}__${ingredient_name}`;
    const nowChecked = !checkedKeys.has(key);
    setCheckedKeys(prev => {
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

  // ── Manual items ──────────────────────────────────────────────────────────
  function addManualItem() {
    if (!newItem.trim()) return;
    const item: ManualItem = {
      id: Math.random().toString(36).slice(2),
      name: newItem.trim(),
      amount: newAmount.trim(),
      unit: newUnit.trim(),
      checked: false,
    };
    saveManual([...manualItems, item]);
    setNewItem(''); setNewAmount(''); setNewUnit('');
  }

  function toggleManualItem(id: string) {
    saveManual(manualItems.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    triggerHaptic();
  }

  function removeManualItem(id: string) {
    saveManual(manualItems.filter(i => i.id !== id));
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  async function clearAllChecks() {
    setClearing(true);
    await fetch(`/api/grocery?clear_week=${weekStart}`, { method: 'DELETE' });
    setCheckedKeys(new Set());
    saveManual(manualItems.map(i => ({ ...i, checked: false })));
    setClearing(false);
  }

  // ── Print ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ── AI Organize ───────────────────────────────────────────────────────────
  async function handleAiOrganize() {
    setAiLoading(true);
    setAiResult('');
    setAiError('');
    try {
      const text = buildExportText(mealGroups, manualItems, people);
      const res = await fetch('/api/grocery/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data.organized);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setAiLoading(false); }
  }

  // ── Copy share link ───────────────────────────────────────────────────────
  async function copyShareLink() {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const combined = buildCombined(mealGroups, checkedKeys, people);
  const uncheckedCombined = combined.filter(item =>
    !item.sources.every(s => checkedKeys.has(`${s.meal_plan_id}__${s.ingredient_name}`)) &&
    !pantry[item.name.toLowerCase()]
  );
  const uncheckedManual = manualItems.filter(i => !i.checked);
  const totalToBuy = uncheckedCombined.length + uncheckedManual.length;
  const totalChecked = combined.filter(item =>
    item.sources.every(s => checkedKeys.has(`${s.meal_plan_id}__${s.ingredient_name}`))
  ).length + manualItems.filter(i => i.checked).length;
  const isEmpty = mealGroups.length === 0 && manualItems.length === 0;

  // Estimated cost from combined (non-pantry items that have a cost set)
  const estimatedCost = combined
    .filter(item => !pantry[item.name.toLowerCase()] && costs[item.name.toLowerCase()] != null)
    .reduce((sum, item) => sum + (costs[item.name.toLowerCase()] ?? 0), 0) +
    manualItems
      .filter(i => !i.checked && costs[i.name.toLowerCase()] != null)
      .reduce((sum, i) => sum + (costs[i.name.toLowerCase()] ?? 0), 0);
  const hasCosts = Object.keys(costs).length > 0;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .print-content { padding: 24px !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="max-w-2xl mx-auto pb-8 print-content" ref={printRef}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-4 pt-4 md:px-6 md:pt-6 mb-3 gap-3 no-print">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Grocery List</h1>
            <div className="flex items-center gap-1 mt-1">
              <button onClick={() => shiftWeek(-1)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
                <ChevronLeft size={14} />
              </button>
              <p className="text-sm text-[var(--text-muted)]">{formatWeekLabel(monday)}</p>
              <button onClick={() => shiftWeek(1)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <Button variant="secondary" size="sm" onClick={() => fetchData(true)} loading={syncing}>
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint} title="Print grocery list">
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowExport(true)} disabled={isEmpty}>
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Order Online</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={copyShareLink} title="Share list">
              <Share2 size={13} />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </Button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        {!isEmpty && (
          <div className="px-4 md:px-6 mb-3 no-print">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PackageCheck size={14} style={{ color: '#10B981' }} />
                  <span className="text-sm font-bold text-[var(--text)]">Shopping Progress</span>
                </div>
                <span className="text-sm font-bold" style={{ color: totalChecked > 0 ? '#10B981' : 'var(--text-muted)' }}>
                  {totalChecked} / {totalChecked + totalToBuy}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalChecked + totalToBuy > 0 ? (totalChecked / (totalChecked + totalToBuy)) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #10B981, #06B6D4)',
                    boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                  }}
                />
              </div>
              {totalChecked > 0 && totalToBuy === 0 && (
                <p className="text-xs font-semibold mt-2 text-center" style={{ color: '#10B981' }}>
                  🎉 All done! Shopping complete.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── People count ── */}
        <div className="px-4 md:px-6 mb-3 no-print">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Users size={15} className="text-[var(--primary)]" />
              <span className="font-medium text-[var(--text)]">People</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPeople(p => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-bold text-[var(--text)] w-6 text-center">{people}</span>
              <button
                onClick={() => setPeople(p => Math.min(100, p + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Plus size={12} />
              </button>
              {people > 1 && (
                <span className="text-xs text-[var(--primary)] font-medium">×{people} scaling active</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary bar ── */}
        {!isEmpty && (
          <div className="sticky top-0 z-20 px-4 md:px-6 py-2 border-b border-[var(--border)] no-print"
            style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-[var(--primary)]" />
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {totalToBuy === 0 ? 'All done ✓' : `${totalToBuy} item${totalToBuy !== 1 ? 's' : ''} to buy`}
                  </span>
                  {totalChecked > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">· {totalChecked} checked</span>
                  )}
                </div>
                {hasCosts && estimatedCost > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <DollarSign size={10} />
                    ~${estimatedCost.toFixed(2)} est.
                    {people > 1 && <span className="opacity-70 ml-1">· ${(estimatedCost / people).toFixed(2)}/head</span>}
                  </span>
                )}
              </div>
              {totalChecked > 0 && (
                <button onClick={() => setShowClearConfirm(true)} disabled={clearing}
                  className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-red-500/10">
                  <Trash2 size={11} /> Clear checks
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── View tabs ── */}
        {!isEmpty && (
          <div className="px-4 md:px-6 mt-3 mb-2 no-print">
            <div className="flex rounded-xl p-1 gap-1 border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
              {(['ingredient', 'meal'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${view === v ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                  style={view === v ? { background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } : {}}>
                  {v === 'ingredient' ? <><List size={12} /> By Ingredient</> : <><LayoutList size={12} /> By Meal</>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-4 md:px-6 pt-2">
          {isEmpty ? (
            <EmptyState onSync={() => fetchData(true)} syncing={syncing} />
          ) : view === 'ingredient' ? (
            <IngredientView
              combined={combined}
              manualItems={manualItems}
              checkedKeys={checkedKeys}
              people={people}
              aiLoading={aiLoading}
              aiResult={aiResult}
              aiError={aiError}
              pantry={pantry}
              costs={costs}
              onToggleCombined={toggleCombinedItem}
              onToggleManual={toggleManualItem}
              onRemoveManual={removeManualItem}
              onAiOrganize={handleAiOrganize}
              onTogglePantry={togglePantry}
              onSetCost={setItemCost}
            />
          ) : (
            <MealView
              groups={mealGroups}
              checkedKeys={checkedKeys}
              people={people}
              onToggle={toggleMealItem}
            />
          )}
        </div>

        {/* ── Add manual item ── */}
        <div className="px-4 md:px-6 mt-4 no-print">
          <div className="rounded-2xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Add Item Manually
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Item name (e.g. paper towels)"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualItem()}
                className="flex-1 text-sm rounded-xl px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                style={{ background: 'var(--surface-2)' }}
              />
              <input
                type="text"
                placeholder="Qty"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                className="w-16 text-sm rounded-xl px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                style={{ background: 'var(--surface-2)' }}
              />
              <input
                type="text"
                placeholder="Unit"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                className="w-16 text-sm rounded-xl px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                style={{ background: 'var(--surface-2)' }}
              />
              <button
                onClick={addManualItem}
                disabled={!newItem.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Clear checks confirm ── */}
      <ConfirmModal
        open={showClearConfirm}
        title="Clear all checks?"
        message="This will uncheck all items for this week. Your grocery items will remain."
        confirmLabel="Clear"
        danger
        onConfirm={() => { setShowClearConfirm(false); clearAllChecks(); }}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* ── Export / Order Online modal ── */}
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        exportText={buildExportText(mealGroups, manualItems, people)}
        instacartUrl={buildInstacartUrl(combined, manualItems)}
      />
    </>
  );
}

// ─── By Ingredient view ────────────────────────────────────────────────────

function IngredientView({
  combined, manualItems, checkedKeys, people,
  aiLoading, aiResult, aiError,
  pantry, costs,
  onToggleCombined, onToggleManual, onRemoveManual, onAiOrganize, onTogglePantry, onSetCost,
}: {
  combined: CombinedItem[];
  manualItems: ManualItem[];
  checkedKeys: Set<string>;
  people: number;
  aiLoading: boolean;
  aiResult: string;
  aiError: string;
  pantry: Record<string, boolean>;
  costs: Record<string, number>;
  onToggleCombined: (item: CombinedItem) => void;
  onToggleManual: (id: string) => void;
  onRemoveManual: (id: string) => void;
  onAiOrganize: () => void;
  onTogglePantry: (name: string) => void;
  onSetCost: (name: string, cost: number | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editingCostFor, setEditingCostFor] = useState<string | null>(null);

  async function copyAiResult() {
    await navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* AI Organize */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--text)]">AI Organize by Store Section</span>
          </div>
          {!aiResult && (
            <button
              onClick={onAiOrganize}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: '#fff', boxShadow: '0 3px 10px rgba(139,92,246,0.3)' }}
            >
              <Sparkles size={11} />
              {aiLoading ? 'Organizing…' : 'Organize'}
            </button>
          )}
        </div>
        <div className="px-4 py-3">
          {aiError && <p className="text-xs text-red-400 mb-2">{aiError}</p>}
          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              Organizing your list by store section…
            </div>
          )}
          {aiResult ? (
            <div>
              <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-sans leading-relaxed mb-3">{aiResult}</pre>
              <div className="flex gap-2">
                <button onClick={copyAiResult}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  <ClipboardCopy size={11} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={onAiOrganize}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  Redo
                </button>
              </div>
            </div>
          ) : !aiLoading && (
            <p className="text-xs text-[var(--text-muted)]">
              Groups your ingredients by store section (Produce, Meat, Dairy…) and combines duplicates.
            </p>
          )}
        </div>
      </div>

      {/* Combined ingredient list */}
      {combined.length > 0 && (() => {
        const toBuyItems = combined.filter(i => !pantry[i.name.toLowerCase()]);
        const pantryItems = combined.filter(i => pantry[i.name.toLowerCase()]);
        function renderCombinedRow(item: CombinedItem) {
          const key = item.name.toLowerCase();
          const isChecked = item.sources.every(s => checkedKeys.has(`${s.meal_plan_id}__${s.ingredient_name}`));
          const inPantry = !!pantry[key];
          const itemCost = costs[key];
          const isEditingCost = editingCostFor === key;
          return (
            <div key={key}
              className={`flex items-center gap-2 px-3 transition-colors ${isChecked || inPantry ? 'opacity-50' : 'hover:bg-[var(--surface-2)]'}`}
              style={{ minHeight: '48px' }}
            >
              {/* Checkbox */}
              <button onClick={() => !inPantry && onToggleCombined(item)} disabled={inPantry}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-2)]'}`}>
                {isChecked && <Check size={11} className="text-white" />}
              </button>
              {/* Name + amount */}
              <span className={`flex-1 text-sm font-medium min-w-0 ${isChecked || inPantry ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                {item.name}
                {item.sameUnit && item.totalAmount > 0 && (
                  <span className="text-[var(--text-muted)] font-normal ml-1.5">
                    — {formatAmt(item.totalAmount)} {item.unit}
                  </span>
                )}
              </span>
              {/* Meal count badge */}
              {item.mealCount > 1 && !inPantry && (
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline">
                  {item.mealCount} meals
                </span>
              )}
              {/* In-pantry badge */}
              {inPantry && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                  <PackageCheck size={9} /> Have it
                </span>
              )}
              {/* Cost inline edit */}
              {!inPantry && (
                isEditingCost ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-[var(--text-muted)]">$</span>
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={itemCost ?? ''}
                      className="w-16 text-xs rounded-lg px-2 py-1 border border-[var(--primary)] text-[var(--text)] outline-none"
                      style={{ background: 'var(--surface-2)' }}
                      onBlur={e => {
                        const v = parseFloat(e.target.value);
                        onSetCost(item.name, isNaN(v) ? null : v);
                        setEditingCostFor(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingCostFor(null);
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingCostFor(key); }}
                    className="shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border transition-all hover:border-emerald-500/30"
                    style={{
                      borderColor: itemCost ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                      color: itemCost ? '#10B981' : 'var(--text-muted)',
                      background: itemCost ? 'rgba(16,185,129,0.08)' : 'transparent',
                    }}
                    title="Set estimated cost"
                  >
                    <DollarSign size={9} />
                    {itemCost ? itemCost.toFixed(2) : 'Price'}
                  </button>
                )
              )}
              {/* Pantry toggle */}
              <button
                onClick={() => onTogglePantry(item.name)}
                title={inPantry ? 'Remove from pantry' : 'Mark as in pantry'}
                className={`shrink-0 p-1.5 rounded-lg transition-all ${inPantry ? 'text-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10'}`}
              >
                <Home size={13} />
              </button>
            </div>
          );
        }
        return (
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                From Meal Plan ({toBuyItems.length} to buy{people > 1 ? ` · ×${people} people` : ''}{pantryItems.length > 0 ? ` · ${pantryItems.length} in pantry` : ''})
              </p>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 opacity-60">
                <Home size={9} /> = in pantry
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {toBuyItems.map(renderCombinedRow)}
              {pantryItems.length > 0 && toBuyItems.length > 0 && (
                <div className="px-4 py-1.5" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Already have</p>
                </div>
              )}
              {pantryItems.map(renderCombinedRow)}
            </div>
          </div>
        );
      })()}

      {/* Manual items */}
      {manualItems.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Additional Items</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {manualItems.map((item) => (
              <div key={item.id}
                className={`flex items-center gap-3 px-4 transition-colors ${item.checked ? 'opacity-50' : 'hover:bg-[var(--surface-2)]'}`}
                style={{ minHeight: '48px' }}>
                <button onClick={() => onToggleManual(item.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-2)]'}`}>
                  {item.checked && <Check size={11} className="text-white" />}
                </button>
                <span className={`flex-1 text-sm font-medium ${item.checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                  {item.name}
                  {item.amount && <span className="text-[var(--text-muted)] font-normal ml-1.5">— {item.amount} {item.unit}</span>}
                </span>
                <button onClick={() => onRemoveManual(item.id)}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 transition-colors ml-1">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── By Meal view ─────────────────────────────────────────────────────────────

function MealView({ groups, checkedKeys, people, onToggle }: {
  groups: MealGroup[];
  checkedKeys: Set<string>;
  people: number;
  onToggle: (meal_plan_id: string, ingredient_name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const emoji = MEAL_EMOJI[group.meal_type] ?? '🍽️';
        const total = group.ingredients.length;
        const checkedCount = group.ingredients.filter(ing => checkedKeys.has(`${group.meal_plan_id}__${ing.name}`)).length;
        const allDone = checkedCount === total && total > 0;
        const isCollapsed = collapsed.has(group.meal_plan_id);

        return (
          <div key={group.meal_plan_id} className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
            <button
              onClick={() => setCollapsed(prev => { const n = new Set(prev); n.has(group.meal_plan_id) ? n.delete(group.meal_plan_id) : n.add(group.meal_plan_id); return n; })}
              className="w-full flex items-center justify-between px-4 hover:bg-[var(--surface-2)] transition-colors text-left"
              style={{ minHeight: '48px' }}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0 py-2">
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allDone ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
                  {allDone ? '✓ Done' : `${total - checkedCount}/${total}`}
                </span>
                {isCollapsed ? <ChevronLeft size={15} className="text-[var(--text-muted)] rotate-90" /> : <ChevronLeft size={15} className="text-[var(--text-muted)] -rotate-90" />}
              </div>
            </button>

            {!isCollapsed && total > 0 && (
              <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                {group.ingredients.map((ing) => {
                  const key = `${group.meal_plan_id}__${ing.name}`;
                  const isChecked = checkedKeys.has(key);
                  return (
                    <button key={ing.name} onClick={() => onToggle(group.meal_plan_id, ing.name)}
                      className={`w-full flex items-center gap-3 px-4 text-left transition-colors ${isChecked ? 'opacity-50' : 'hover:bg-[var(--surface-2)]'}`}
                      style={{ minHeight: '48px' }}>
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-2)]'}`}>
                        {isChecked && <Check size={11} className="text-white" />}
                      </span>
                      <span className={`flex-1 text-sm font-medium ${isChecked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                        {ing.name}
                        <span className="text-[var(--text-muted)] font-normal ml-1.5">
                          — {formatAmt(ing.amount * people)} {ing.unit}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
        <ShoppingCart size={28} className="text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-[var(--text)] text-base font-semibold mb-1">No meals planned this week</p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs">
          Add recipes to your meal calendar, then sync here to build your grocery list automatically.
        </p>
      </div>
      <button onClick={onSync} disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: 'var(--primary)' }}>
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync from Calendar'}
      </button>
    </div>
  );
}

// ─── Export / Order Online modal ───────────────────────────────────────────────

function ExportModal({ open, onClose, exportText, instacartUrl }: {
  open: boolean;
  onClose: () => void;
  exportText: string;
  instacartUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(text: string) {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const body = (
    <div className="flex flex-col gap-3">
      {/* Copy list */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCopy size={15} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Copy List</span>
        </div>
        <textarea readOnly value={exportText} rows={4}
          className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] px-3 py-2 resize-none outline-none mb-2 font-mono" />
        <Button variant="primary" size="sm" onClick={() => handleCopy(exportText)} className="w-full justify-center">
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>

      {/* Instacart */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🥕</span>
          <span className="text-sm font-semibold text-[var(--text)]">Order on Instacart</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Opens Instacart with your ingredients pre-searched. Copy your list above to paste into the cart.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleCopy(exportText)} className="flex-1 justify-center">
            <ClipboardCopy size={12} /> Copy List First
          </Button>
          <Button variant="primary" size="sm"
            onClick={() => openUrl(instacartUrl)}
            className="flex-1 justify-center">
            <ExternalLink size={12} /> Open Instacart
          </Button>
        </div>
      </div>

      {/* Walmart */}
      <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🛒</span>
          <span className="text-sm font-semibold text-[var(--text)]">Order on Walmart</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">Copy your list above, then paste it into a Walmart grocery list.</p>
        <Button variant="secondary" size="sm"
          onClick={() => openUrl('https://www.walmart.com/lists')}
          className="w-full justify-center">
          Open Walmart Grocery →
        </Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Order Online" size="md">
      <div className="pt-1">{body}</div>
    </Modal>
  );
}
