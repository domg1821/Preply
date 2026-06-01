'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Users, Calendar, Printer,
  ClipboardCopy, ExternalLink, Minus, BookOpen, Check, PartyPopper,
  ChefHat, Crown, Download, Tag, UtensilsCrossed, Leaf, Wheat, Nut,
  Fish, Milk, Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { openUrl, copyToClipboard, isNative } from '@/lib/capacitor';
import { useIsNative } from '@/lib/useIsNative';
import { Recipe } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type CourseType = 'appetizer' | 'main' | 'side' | 'dessert' | 'drink' | 'other';

const COURSES: { value: CourseType; label: string; emoji: string }[] = [
  { value: 'appetizer', label: 'Appetizer', emoji: '🥗' },
  { value: 'main', label: 'Main', emoji: '🍽️' },
  { value: 'side', label: 'Side', emoji: '🥘' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'drink', label: 'Drink', emoji: '🥂' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const DIETARY_OPTIONS = [
  { label: 'Vegan', icon: Leaf, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { label: 'Vegetarian', icon: Leaf, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Gluten-Free', icon: Wheat, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { label: 'Nut-Free', icon: Nut, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { label: 'Dairy-Free', icon: Milk, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { label: 'Pescatarian', icon: Fish, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
];

interface EventRecipe {
  recipeId: string;
  recipeName: string;
  servingsPerPerson: number;
  course: CourseType;
  dietaryLabels: string[];
  description?: string;
}

interface EventMenu {
  id: string;
  name: string;
  date?: string;
  guestCount: number;
  notes?: string;
  recipes: EventRecipe[];
  createdAt: string;
}

type AggregatedIngredient = { name: string; amount: number; unit: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENTS_KEY = 'preply_events';

function loadEvents(): EventMenu[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed: EventMenu[] = JSON.parse(raw);
    // Migrate old events that may lack course/dietaryLabels fields
    return parsed.map(e => ({
      ...e,
      recipes: e.recipes.map(r => ({
        ...r,
        course: r.course ?? 'main',
        dietaryLabels: r.dietaryLabels ?? [],
      })),
    }));
  } catch { return []; }
}

function saveEvents(events: EventMenu[]) {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); } catch { /* ignore */ }
}

function formatAmt(n: number): string {
  if (n % 1 === 0) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

function buildIngredients(event: EventMenu, recipes: Recipe[]): AggregatedIngredient[] {
  const map = new Map<string, { amount: number; unit: string }>();
  for (const er of event.recipes) {
    const recipe = recipes.find(r => r.id === er.recipeId);
    if (!recipe) continue;
    const scale = event.guestCount * er.servingsPerPerson;
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing && existing.unit === ing.unit) {
        existing.amount += ing.amount_per_serving * scale;
      } else if (!existing) {
        map.set(key, { amount: ing.amount_per_serving * scale, unit: ing.unit });
      }
    }
  }
  return Array.from(map.entries())
    .map(([name, { amount, unit }]) => ({ name, amount, unit }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCopyText(event: EventMenu, ingredients: AggregatedIngredient[]): string {
  const lines: string[] = [
    event.name,
    event.date ? `Date: ${event.date}` : '',
    `Guests: ${event.guestCount}`,
    '',
    'MENU:',
    ...COURSES.flatMap(c => {
      const courseRecipes = event.recipes.filter(r => r.course === c.value);
      if (!courseRecipes.length) return [];
      return [
        `${c.emoji} ${c.label.toUpperCase()}`,
        ...courseRecipes.map(r => `  • ${r.recipeName}${r.dietaryLabels.length ? ` (${r.dietaryLabels.join(', ')})` : ''}`),
        '',
      ];
    }),
    'SHOPPING LIST:',
    ...ingredients.map(i => `  • ${i.name} — ${formatAmt(i.amount)} ${i.unit}`),
  ];
  return lines.filter(l => l !== undefined).join('\n');
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportMenuPDF(event: EventMenu, ingredients: AggregatedIngredient[]) {
  const dateStr = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const coursesSections = COURSES.flatMap(c => {
    const courseRecipes = event.recipes.filter(r => r.course === c.value);
    if (!courseRecipes.length) return [];
    return [`
      <div class="course-section">
        <h3 class="course-title"><span class="course-emoji">${c.emoji}</span> ${c.label}</h3>
        ${courseRecipes.map(r => `
          <div class="recipe-item">
            <div class="recipe-name">${r.recipeName}</div>
            <div class="recipe-meta">
              ${r.servingsPerPerson} serving/person · ${event.guestCount * r.servingsPerPerson} total servings
              ${r.dietaryLabels.length ? `<span class="dietary-tags">${r.dietaryLabels.map(l => `<span class="tag">${l}</span>`).join('')}</span>` : ''}
            </div>
            ${r.description ? `<div class="recipe-desc">${r.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `];
  });

  // Fallback: if no course sections, list all recipes flat
  const menuContent = coursesSections.length > 0
    ? coursesSections.join('')
    : event.recipes.map(r => `
        <div class="recipe-item">
          <div class="recipe-name">${r.recipeName}</div>
          <div class="recipe-meta">${r.servingsPerPerson} serving/person · ${event.guestCount * r.servingsPerPerson} total</div>
        </div>
      `).join('');

  const shoppingHtml = ingredients.length > 0 ? `
    <div class="section shopping-section">
      <h2 class="section-title">Shopping List</h2>
      <p class="shopping-subtitle">Scaled for ${event.guestCount} guest${event.guestCount !== 1 ? 's' : ''}</p>
      <div class="shopping-grid">
        ${ingredients.map(i => `
          <div class="shopping-item">
            <span class="item-name">${i.name}</span>
            <span class="item-amount">${formatAmt(i.amount)} ${i.unit}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.name} — Event Menu</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #fff;
      color: #1a1a2e;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 40px;
    }

    /* ── Hero header ── */
    .hero {
      text-align: center;
      padding-bottom: 32px;
      margin-bottom: 32px;
      border-bottom: 2px solid #e8f5f0;
      position: relative;
    }
    .hero::before {
      content: '';
      display: block;
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, #10B981, #059669);
      border-radius: 2px;
      margin: 0 auto 20px;
    }
    .event-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    .event-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #64748b;
    }
    .event-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .event-meta-dot { color: #cbd5e1; }
    .powered-by {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 14px;
      letter-spacing: 0.5px;
    }
    .powered-by span { color: #10B981; font-weight: 600; }

    /* ── Section ── */
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    /* ── Course sections ── */
    .menu-section { margin-bottom: 28px; }
    .course-section { margin-bottom: 24px; }
    .course-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #10B981;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .course-emoji { font-size: 14px; }

    .recipe-item {
      padding: 10px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .recipe-item:last-child { border-bottom: none; }
    .recipe-name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 3px;
    }
    .recipe-meta {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .recipe-desc {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
      margin-top: 4px;
    }
    .dietary-tags { display: inline-flex; gap: 4px; }
    .tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
      padding: 1px 6px;
      border-radius: 99px;
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    /* ── Shopping list ── */
    .shopping-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
    }
    .shopping-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 14px;
      margin-top: -10px;
    }
    .shopping-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
    }
    .shopping-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .item-name { color: #334155; font-weight: 500; }
    .item-amount { color: #64748b; }

    /* ── Notes ── */
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 13px;
      color: #92400e;
      margin-bottom: 24px;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <h1 class="event-name">${event.name}</h1>
      <div class="event-meta">
        ${dateStr ? `<span class="event-meta-item">📅 ${dateStr}</span><span class="event-meta-dot">·</span>` : ''}
        <span class="event-meta-item">👥 ${event.guestCount} guest${event.guestCount !== 1 ? 's' : ''}</span>
        <span class="event-meta-dot">·</span>
        <span class="event-meta-item">🍽️ ${event.recipes.length} dish${event.recipes.length !== 1 ? 'es' : ''}</span>
      </div>
      <p class="powered-by">Created with <span>Preply</span> · preply.app</p>
    </div>

    ${event.notes ? `<div class="notes-box">📝 ${event.notes}</div>` : ''}

    <div class="section menu-section">
      <h2 class="section-title">Menu</h2>
      ${menuContent}
    </div>

    ${shoppingHtml}

    <div class="footer">
      Generated by Preply · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventsPage() {
  const native = useIsNative();
  const [events, setEvents] = useState<EventMenu[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showProGate, setShowProGate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // New event form
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newGuests, setNewGuests] = useState('10');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => { setEvents(loadEvents()); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('is_premium').eq('id', user.id).single()
        .then(({ data }) => { if (data?.is_premium) setIsPremium(true); });
    });
  }, []);

  const fetchRecipes = useCallback(async () => {
    if (recipes.length > 0) return;
    setLoadingRecipes(true);
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      setRecipes(data ?? []);
    } finally { setLoadingRecipes(false); }
  }, [recipes.length]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const selectedEvent = events.find(e => e.id === selectedId) ?? null;
  const ingredients = selectedEvent ? buildIngredients(selectedEvent, recipes) : [];

  function createEvent() {
    if (!newName.trim()) return;
    const event: EventMenu = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      date: newDate || undefined,
      guestCount: Math.max(1, Number(newGuests) || 10),
      notes: newNotes.trim() || undefined,
      recipes: [],
      createdAt: new Date().toISOString(),
    };
    const next = [event, ...events];
    setEvents(next);
    saveEvents(next);
    setNewName(''); setNewDate(''); setNewGuests('10'); setNewNotes('');
    setShowNewForm(false);
    setSelectedId(event.id);
  }

  function deleteEvent(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDeleteEvent() {
    if (!confirmDeleteId) return;
    const next = events.filter(e => e.id !== confirmDeleteId);
    setEvents(next);
    saveEvents(next);
    if (selectedId === confirmDeleteId) setSelectedId(null);
    setConfirmDeleteId(null);
  }

  function updateEvent(updated: EventMenu) {
    const next = events.map(e => e.id === updated.id ? updated : e);
    setEvents(next);
    saveEvents(next);
  }

  function addRecipeToEvent(recipe: Recipe, course: CourseType) {
    if (!selectedEvent) return;
    if (selectedEvent.recipes.some(r => r.recipeId === recipe.id)) return;
    updateEvent({
      ...selectedEvent,
      recipes: [...selectedEvent.recipes, {
        recipeId: recipe.id,
        recipeName: recipe.name,
        servingsPerPerson: 1,
        course,
        dietaryLabels: [],
      }],
    });
    setShowAddRecipe(false);
  }

  function removeRecipeFromEvent(recipeId: string) {
    if (!selectedEvent) return;
    updateEvent({ ...selectedEvent, recipes: selectedEvent.recipes.filter(r => r.recipeId !== recipeId) });
  }

  function updateServingsPerPerson(recipeId: string, delta: number) {
    if (!selectedEvent) return;
    updateEvent({
      ...selectedEvent,
      recipes: selectedEvent.recipes.map(r =>
        r.recipeId === recipeId
          ? { ...r, servingsPerPerson: Math.max(0.5, r.servingsPerPerson + delta) }
          : r
      ),
    });
  }

  function updateRecipeCourse(recipeId: string, course: CourseType) {
    if (!selectedEvent) return;
    updateEvent({
      ...selectedEvent,
      recipes: selectedEvent.recipes.map(r => r.recipeId === recipeId ? { ...r, course } : r),
    });
  }

  function toggleDietaryLabel(recipeId: string, label: string) {
    if (!selectedEvent) return;
    updateEvent({
      ...selectedEvent,
      recipes: selectedEvent.recipes.map(r => {
        if (r.recipeId !== recipeId) return r;
        const has = r.dietaryLabels.includes(label);
        return { ...r, dietaryLabels: has ? r.dietaryLabels.filter(l => l !== label) : [...r.dietaryLabels, label] };
      }),
    });
  }

  function updateRecipeDescription(recipeId: string, description: string) {
    if (!selectedEvent) return;
    updateEvent({
      ...selectedEvent,
      recipes: selectedEvent.recipes.map(r => r.recipeId === recipeId ? { ...r, description } : r),
    });
  }

  function updateGuestCount(delta: number) {
    if (!selectedEvent) return;
    updateEvent({ ...selectedEvent, guestCount: Math.max(1, selectedEvent.guestCount + delta) });
  }

  async function copyList() {
    if (!selectedEvent) return;
    await copyToClipboard(buildCopyText(selectedEvent, ingredients));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handlePrint() { window.print(); }

  async function handleExportPDF() {
    if (!isPremium) { setShowProGate(true); return; }
    if (!selectedEvent) return;
    if (isNative()) {
      // window.print() / popup is blocked in WKWebView — copy formatted text instead
      const text = buildCopyText(selectedEvent, ingredients);
      await copyToClipboard(text);
      setExportToast('Menu copied — paste into Notes, Mail, or Messages to share');
      setTimeout(() => setExportToast(null), 4000);
    } else {
      exportMenuPDF(selectedEvent, ingredients);
    }
  }

  async function orderOnline() {
    const items = ingredients.slice(0, 20).map(i => i.name).join(', ');
    await openUrl(`https://www.instacart.com/store/search_v3/term?term=${encodeURIComponent(items)}`);
  }

  // ─── Event List View ──────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <>
        <style>{`@media print { .no-print { display: none !important; } }`}</style>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5 no-print">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Event Menus</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Plan menus for parties, catering, or large gatherings</p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              <Plus size={15} />
              New Event
            </button>
          </div>

          {/* Pro callout for free users — hidden in the iOS app (no external purchase) */}
          {!isPremium && !native && (
            <div className="rounded-2xl border border-amber-500/20 p-4 mb-5 flex items-start gap-3 no-print"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))' }}>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Crown size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] mb-0.5">Unlock polished PDF export with Premium</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Create beautiful, print-ready menus with course sections, dietary labels, and guest-scaled shopping lists. Free users can plan menus — Pro users can export them.
                </p>
              </div>
              <a href="/settings"
                className="shrink-0 text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
                Upgrade →
              </a>
            </div>
          )}

          {/* New Event Form */}
          {showNewForm && (
            <div className="rounded-2xl border border-[var(--primary)]/25 p-5 mb-5 no-print"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))' }}>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <PartyPopper size={15} className="text-[var(--primary)]" />
                Create New Event Menu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1.5">Event name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Christmas Dinner, Wedding Reception"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createEvent()}
                    className="w-full text-sm rounded-xl px-3 py-2.5 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1.5">Date (optional)</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2.5 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors"
                    style={{ background: 'var(--surface-2)', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1.5">Number of guests *</label>
                  <input
                    type="number"
                    min="1"
                    value={newGuests}
                    onChange={e => setNewGuests(e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2.5 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1.5">Notes / theme (optional)</label>
                  <input
                    type="text"
                    placeholder="Dietary restrictions, theme..."
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2.5 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-all">
                  Cancel
                </button>
                <button onClick={createEvent} disabled={!newName.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  Create Event
                </button>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] p-10 text-center"
              style={{ background: 'var(--surface)' }}>
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                <ChefHat size={24} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1">No event menus yet</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4 max-w-xs mx-auto">
                Create a menu for a party or catering job — add recipes by course, set guest count, and get a scaled shopping list instantly.
              </p>
              <button onClick={() => setShowNewForm(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                <Plus size={14} /> Create your first event
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map(event => (
                <div key={event.id}
                  className="rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--border-2)] transition-all group"
                  style={{ background: 'var(--surface)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setSelectedId(event.id)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">{event.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                        {event.date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Users size={11} /> {event.guestCount} guests</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {event.recipes.length} recipe{event.recipes.length !== 1 ? 's' : ''}</span>
                      </div>
                      {event.notes && <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60 truncate">{event.notes}</p>}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setSelectedId(event.id)}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--primary)', color: '#fff' }}>
                        Open <ChevronRight size={13} />
                      </button>
                      <button onClick={() => deleteEvent(event.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          open={!!confirmDeleteId}
          title="Delete event menu?"
          message="This will permanently remove the event and its recipe list."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteEvent}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </>
    );
  }

  // ─── Event Detail View ────────────────────────────────────────────────────
  if (!selectedEvent) return null;

  // Group recipes by course for display
  const recipesByCourse = COURSES.reduce<Record<CourseType, typeof selectedEvent.recipes>>((acc, c) => {
    acc[c.value] = selectedEvent.recipes.filter(r => r.course === c.value);
    return acc;
  }, {} as Record<CourseType, typeof selectedEvent.recipes>);
  const hasAnyCourse = COURSES.some(c => recipesByCourse[c.value].length > 0);

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; color: black !important; } }`}</style>
      <div className="max-w-2xl mx-auto pb-12">

        {/* Header */}
        <div className="px-4 pt-4 md:px-6 md:pt-6 mb-4 no-print">
          <button onClick={() => setSelectedId(null)}
            className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-3">
            <ChevronLeft size={15} /> All Events
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[var(--text)] truncate">{selectedEvent.name}</h1>
              <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1 flex-wrap">
                {selectedEvent.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {selectedEvent.notes && <span className="opacity-60 truncate">{selectedEvent.notes}</span>}
              </div>
            </div>
            <button onClick={() => deleteEvent(selectedEvent.id)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Guest Count */}
        <div className="px-4 md:px-6 mb-4 no-print">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
            <Users size={15} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--text)] flex-1">Guests</span>
            <div className="flex items-center gap-2">
              <button onClick={() => updateGuestCount(-1)}
                className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all">
                <Minus size={12} />
              </button>
              <span className="text-sm font-bold text-[var(--text)] w-8 text-center">{selectedEvent.guestCount}</span>
              <button onClick={() => updateGuestCount(1)}
                className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all">
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Recipes — grouped by course */}
        <div className="px-4 md:px-6 mb-4 no-print">
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Menu ({selectedEvent.recipes.length} dish{selectedEvent.recipes.length !== 1 ? 'es' : ''})
              </p>
              <button onClick={() => { fetchRecipes(); setShowAddRecipe(true); }}
                className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                <Plus size={12} /> Add Dish
              </button>
            </div>

            {selectedEvent.recipes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <UtensilsCrossed size={28} className="text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--text-muted)] mb-2">No dishes added yet.</p>
                <button onClick={() => { fetchRecipes(); setShowAddRecipe(true); }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                  <Plus size={13} /> Add your first dish
                </button>
              </div>
            ) : hasAnyCourse ? (
              <div className="divide-y divide-[var(--border)]">
                {COURSES.map(c => {
                  const courseRecipes = recipesByCourse[c.value];
                  if (!courseRecipes.length) return null;
                  return (
                    <div key={c.value}>
                      <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'var(--surface-2)' }}>
                        <span className="text-sm">{c.emoji}</span>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{c.label}</p>
                        <span className="text-[10px] text-[var(--text-muted)] opacity-60 ml-auto">{courseRecipes.length} dish{courseRecipes.length !== 1 ? 'es' : ''}</span>
                      </div>
                      {courseRecipes.map(er => (
                        <RecipeRow
                          key={er.recipeId}
                          er={er}
                          guestCount={selectedEvent.guestCount}
                          onServingChange={updateServingsPerPerson}
                          onCourseChange={updateRecipeCourse}
                          onDietaryToggle={toggleDietaryLabel}
                          onDescriptionChange={updateRecipeDescription}
                          onRemove={removeRecipeFromEvent}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {selectedEvent.recipes.map(er => (
                  <RecipeRow
                    key={er.recipeId}
                    er={er}
                    guestCount={selectedEvent.guestCount}
                    onServingChange={updateServingsPerPerson}
                    onCourseChange={updateRecipeCourse}
                    onDietaryToggle={toggleDietaryLabel}
                    onDescriptionChange={updateRecipeDescription}
                    onRemove={removeRecipeFromEvent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ingredient / Shopping List */}
        {ingredients.length > 0 && (
          <div className="px-4 md:px-6 mb-4">
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Shopping List · {ingredients.length} items · {selectedEvent.guestCount} guests
                </p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {ingredients.map(ing => (
                  <div key={ing.name} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-sm text-[var(--text)] font-medium">{ing.name}</span>
                    <span className="text-sm text-[var(--text-muted)] tabular-nums">{formatAmt(ing.amount)} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedEvent.recipes.length > 0 && (
          <div className="px-4 md:px-6 no-print space-y-3">
            {/* Export PDF — Pro feature. On iOS, only show to premium users (no upsell). */}
            {(isPremium || !native) && (
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: isPremium ? 'var(--border)' : 'rgba(245,158,11,0.25)' }}>
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between"
                style={{ background: isPremium ? 'var(--surface-2)' : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))' }}>
                <div className="flex items-center gap-2">
                  <Download size={14} className={isPremium ? 'text-[var(--primary)]' : 'text-amber-400'} />
                  <span className="text-sm font-semibold text-[var(--text)]">Export Polished PDF Menu</span>
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                      <Crown size={8} /> PRO
                    </span>
                  )}
                </div>
                {isPremium ? (
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    <Download size={11} /> Export PDF
                  </button>
                ) : (
                  <a href="/settings" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                    Unlock →
                  </a>
                )}
              </div>
              <div className="px-4 py-3">
                {isPremium ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Opens a beautifully formatted menu with course sections, dietary labels, and shopping list. Save it as PDF using your browser's print dialog.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    Upgrade to Premium to export a beautifully formatted PDF menu with course sections, dietary labels, and a guest-scaled shopping list — ready to print or share.
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
                <Printer size={14} /> Basic Print
              </button>
              <button onClick={copyList}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
                <ClipboardCopy size={14} />
                {copied ? 'Copied!' : 'Copy List'}
              </button>
              {ingredients.length > 0 && (
                <button onClick={orderOnline}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
                  <ExternalLink size={14} /> Order on Instacart
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Recipe Modal */}
      {showAddRecipe && (
        <AddRecipeModal
          recipes={recipes}
          loadingRecipes={loadingRecipes}
          existingIds={selectedEvent.recipes.map(r => r.recipeId)}
          onAdd={addRecipeToEvent}
          onClose={() => setShowAddRecipe(false)}
        />
      )}

      {/* Confirm delete */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete event menu?"
        message="This will permanently remove the event and its recipe list. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteEvent}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Export toast (native fallback) */}
      {exportToast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white"
          style={{ background: 'var(--primary)', maxWidth: 'calc(100vw - 32px)' }}>
          {exportToast}
        </div>
      )}

      {/* Pro Gate Modal */}
      {showProGate && !native && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProGate(false)} />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="relative px-6 pt-6 pb-5 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))' }}>
              <button onClick={() => setShowProGate(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                style={{ background: 'var(--surface-2)' }}>
                <span className="text-sm leading-none">✕</span>
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                <Crown size={26} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-1">Polished PDF Export</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Export beautiful, print-ready menus with elegant typography, course sections, and dietary labels.
              </p>
            </div>
            <div className="px-6 py-4 space-y-2.5">
              {[
                { icon: '📄', text: 'Formatted menu with course sections' },
                { icon: '🏷️', text: 'Dietary & allergy labels per dish' },
                { icon: '🛒', text: 'Guest-scaled shopping list included' },
                { icon: '✨', text: 'Elegant typography ready to print or share' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{icon}</span>
                  <p className="text-sm text-[var(--text)]">{text}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <a href="/settings"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000' }}>
                <Crown size={15} />
                Unlock Premium — From $3.50/mo
              </a>
              <p className="text-center text-[10px] text-[var(--text-muted)]">
                🛡️ 7-day money-back guarantee · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Recipe Row ───────────────────────────────────────────────────────────────

function RecipeRow({
  er, guestCount, onServingChange, onCourseChange, onDietaryToggle, onDescriptionChange, onRemove,
}: {
  er: EventRecipe;
  guestCount: number;
  onServingChange: (id: string, delta: number) => void;
  onCourseChange: (id: string, course: CourseType) => void;
  onDietaryToggle: (id: string, label: string) => void;
  onDescriptionChange: (id: string, desc: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = guestCount * er.servingsPerPerson;

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <BookOpen size={13} className="text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate">{er.recipeName}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-[var(--text-muted)]">
              {er.servingsPerPerson} serving/person · {total} total
            </p>
            {er.dietaryLabels.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {er.dietaryLabels.map(l => (
                  <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">{l}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onServingChange(er.recipeId, -0.5)}
            className="w-6 h-6 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-all">
            <Minus size={10} />
          </button>
          <span className="text-sm font-bold text-[var(--text)] w-6 text-center">{er.servingsPerPerson}</span>
          <button onClick={() => onServingChange(er.recipeId, 0.5)}
            className="w-6 h-6 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-all">
            <Plus size={10} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className={`p-1.5 rounded-md transition-all ${expanded ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            title="Edit labels & course"
          >
            <Tag size={13} />
          </button>
          <button onClick={() => onRemove(er.recipeId)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded editor — course + dietary labels + description */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ background: 'var(--surface-2)' }}>
          {/* Course selector */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Course</p>
            <div className="flex gap-1.5 flex-wrap">
              {COURSES.map(c => (
                <button
                  key={c.value}
                  onClick={() => onCourseChange(er.recipeId, c.value)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                    er.course === c.value
                      ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary labels */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Dietary Labels</p>
            <div className="flex gap-1.5 flex-wrap">
              {DIETARY_OPTIONS.map(opt => {
                const active = er.dietaryLabels.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    onClick={() => onDietaryToggle(er.recipeId, opt.label)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                      active ? opt.color : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {active && <Check size={10} className="inline mr-1" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu description */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Menu Description (optional)</p>
            <input
              type="text"
              placeholder="e.g. Slow-roasted with herbs and seasonal vegetables"
              value={er.description ?? ''}
              onChange={e => onDescriptionChange(er.recipeId, e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
              style={{ background: 'var(--surface)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Recipe Modal ─────────────────────────────────────────────────────────

function AddRecipeModal({
  recipes, loadingRecipes, existingIds, onAdd, onClose,
}: {
  recipes: Recipe[];
  loadingRecipes: boolean;
  existingIds: string[];
  onAdd: (recipe: Recipe, course: CourseType) => void;
  onClose: () => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState<CourseType>('main');
  const [search, setSearch] = useState('');

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-semibold text-[var(--text)]">Add Dish to Menu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-lg leading-none">×</button>
        </div>

        {/* Course selector */}
        <div className="px-5 pt-3 pb-2 border-b border-[var(--border)] shrink-0">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Add to course</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {COURSES.map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedCourse(c.value)}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                  selectedCourse === c.value
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 shrink-0">
          <input
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
            style={{ background: 'var(--surface-2)' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRecipes ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">Loading recipes…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">{search ? 'No recipes match.' : 'No recipes found. Add some recipes first.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filtered.map(recipe => {
                const alreadyAdded = existingIds.includes(recipe.id);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => !alreadyAdded && onAdd(recipe, selectedCourse)}
                    disabled={alreadyAdded}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${alreadyAdded ? 'opacity-40' : 'hover:bg-[var(--surface-2)]'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      {alreadyAdded
                        ? <Check size={14} className="text-[var(--primary)]" />
                        : <BookOpen size={14} className="text-[var(--primary)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{recipe.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {recipe.default_servings} serving{recipe.default_servings !== 1 ? 's' : ''} · {recipe.ingredients.length} ingredients
                      </p>
                    </div>
                    {alreadyAdded
                      ? <span className="text-xs text-[var(--text-muted)]">Added</span>
                      : <span className="text-xs text-[var(--primary)] font-medium">→ {COURSES.find(c => c.value === selectedCourse)?.label}</span>
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
