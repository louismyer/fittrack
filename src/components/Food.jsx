import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Plus, ChevronDown, ChevronUp, Search, X, Loader2,
  ArrowLeft, Check, Settings,
} from 'lucide-react';
import { useDayData, useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import {
  getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison,
} from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import DateNav from './ui/DateNav';
import WeekComparison from './WeekComparison';

// ─── Constants ────────────────────────────────────────────────────────────────

const USDA_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
const MEAL_KEYS  = ['breakfast', 'lunch', 'dinner', 'snacks'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };
const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };
const DEFAULT_MEALS   = { breakfast: [], lunch: [], dinner: [], snacks: [] };
const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
const UNITS = ['g', 'oz', 'ml', 'cup', 'tbsp', 'tsp', 'custom'];
const GRAM_EQUIV = { g: 1, ml: 1, oz: 28.3495, cup: 240, tbsp: 15, tsp: 5 };

const INPUT_CLS = 'w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 dark:placeholder-slate-500';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise raw stored value → structured meals object */
function normalizeMeals(raw) {
  if (!raw) return { ...DEFAULT_MEALS };
  if (Array.isArray(raw)) return { breakfast: raw, lunch: [], dinner: [], snacks: [] };
  if (raw.breakfast !== undefined) return raw;
  return { ...DEFAULT_MEALS };
}

/** Find a USDA nutrient value by ID */
function getNutrient(nutrients, id) {
  return nutrients?.find(n => n.nutrientId === id)?.value ?? 0;
}

/**
 * Normalise USDA nutrient values to per-100g basis.
 * SR Legacy values are already per 100g.
 * Branded values are per serving → convert using servingSize.
 */
function getPer100g(food) {
  const n = food.foodNutrients || [];
  const factor = (food.dataType === 'Branded' && food.servingSize)
    ? 100 / food.servingSize
    : 1;
  return {
    calories: getNutrient(n, 1008) * factor,
    protein:  getNutrient(n, 1003) * factor,
    carbs:    getNutrient(n, 1005) * factor,
    fat:      getNutrient(n, 1004) * factor,
  };
}

/** Calculate macros from per-100g values, quantity and unit */
function calcMacros(per100g, quantity, unit) {
  const q = parseFloat(quantity) || 0;
  if (unit === 'custom') return { calories: q, protein: 0, carbs: 0, fat: 0 };
  const grams = q * (GRAM_EQUIV[unit] ?? 1);
  const r = grams / 100;
  return {
    calories: Math.round(per100g.calories * r),
    protein:  Math.round(per100g.protein  * r * 10) / 10,
    carbs:    Math.round(per100g.carbs    * r * 10) / 10,
    fat:      Math.round(per100g.fat      * r * 10) / 10,
  };
}

// ─── MacroBar ─────────────────────────────────────────────────────────────────

function MacroBar({ label, value, target, barClass }) {
  const pct  = Math.min((value / (target || 1)) * 100, 100);
  const over = value > target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        <span className={over ? 'text-red-500 font-bold' : 'font-semibold text-gray-600 dark:text-slate-300'}>
          {value}{label === 'Calories' ? ' kcal' : 'g'} / {target}{label === 'Calories' ? ' kcal' : 'g'}
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${over ? 'bg-red-400' : barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── CaloriesChart ────────────────────────────────────────────────────────────

function CaloriesChart({ calTarget }) {
  const data = getSeriesData('food', getPastDates(14));
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">
        14-Day Calories
      </p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
            <Tooltip
              formatter={(v) => [`${v} kcal`, 'Calories']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
            />
            {calTarget > 0 && (
              <ReferenceLine y={calTarget} stroke="#FC4C02" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            <Bar dataKey="value" fill="#FC4C02" radius={[3, 3, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── MealSection ──────────────────────────────────────────────────────────────

function MealSection({ mealKey, items, onAddFood, onRemoveFood }) {
  const [open, setOpen] = useState(true);

  const subtotal = useMemo(() =>
    items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein:  acc.protein  + (item.protein  || 0),
      carbs:    acc.carbs    + (item.carbs    || 0),
      fat:      acc.fat      + (item.fat      || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 }),
  [items]);

  return (
    <Card>
      {/* Section toggle header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{MEAL_ICONS[mealKey]}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{MEAL_LABELS[mealKey]}</span>
          {subtotal.calories > 0 && (
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
              {subtotal.calories} kcal
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={15} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {/* Food entries */}
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.name}</p>
                {item.brand && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{item.brand}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-brand">{item.calories} kcal</span>
                  <span className="text-gray-200 dark:text-slate-700 text-xs">·</span>
                  <span className="text-xs font-medium text-blue-500">P {item.protein}g</span>
                  <span className="text-gray-200 dark:text-slate-700 text-xs">·</span>
                  <span className="text-xs font-medium text-green-500">C {item.carbs}g</span>
                  <span className="text-gray-200 dark:text-slate-700 text-xs">·</span>
                  <span className="text-xs font-medium text-yellow-500">F {item.fat}g</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    · {item.quantity}{item.unit}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFood(mealKey, item.id)}
                className="flex-shrink-0 mt-0.5 p-1 text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors rounded"
                aria-label="Remove"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {/* Subtotal row */}
          {items.length > 0 && (
            <div className="flex items-center justify-between pt-1.5 px-1 border-t border-gray-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                Subtotal
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-brand">{subtotal.calories} kcal</span>
                <span className="text-blue-500 font-medium">P {Math.round(subtotal.protein)}g</span>
                <span className="text-green-500 font-medium">C {Math.round(subtotal.carbs)}g</span>
                <span className="text-yellow-500 font-medium">F {Math.round(subtotal.fat)}g</span>
              </div>
            </div>
          )}

          {/* Add Food button */}
          <button
            type="button"
            onClick={() => onAddFood(mealKey)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-400 dark:text-slate-500 hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Food
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── FoodSearchModal ──────────────────────────────────────────────────────────

function FoodSearchModal({ mealKey, onClose, onSelectFood }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search` +
        `?query=${encodeURIComponent(q)}` +
        `&api_key=${USDA_KEY}` +
        `&pageSize=20` +
        `&dataType=Branded,SR%20Legacy`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResults(json.foods || []);
    } catch {
      setError('Search failed — check your connection and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Add to {MEAL_LABELS[mealKey]}
        </h2>
      </div>

      {/* Search input */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search foods, brands…"
            className={`${INPUT_CLS} pl-9`}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-brand" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Searching…</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && query && results.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && !error && !query && (
          <div className="px-4 py-10 text-center">
            <Search size={32} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Type to search the USDA food database</p>
          </div>
        )}

        {!loading && results.map(food => {
          const cals = Math.round(getNutrient(food.foodNutrients, 1008));
          const isBranded = food.dataType === 'Branded';
          return (
            <button
              key={food.fdcId}
              type="button"
              onClick={() => onSelectFood(food)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                  {food.description}
                </p>
                {food.brandName && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{food.brandName}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {isBranded && food.servingSize
                    ? `Per serving (${food.servingSize}${food.servingSizeUnit || 'g'})`
                    : 'Per 100g'}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-black text-brand">{cals}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">kcal</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FoodDetailModal ──────────────────────────────────────────────────────────

function FoodDetailModal({ food, mealKey, onBack, onClose, onLog }) {
  const per100g = useMemo(() => getPer100g(food), [food]);

  const defaultUnit = 'g';
  const defaultQty  = String(
    food.dataType === 'Branded' && food.servingSize ? food.servingSize : 100,
  );

  const [unit, setUnit]         = useState(defaultUnit);
  const [quantity, setQuantity] = useState(defaultQty);

  const macros = useMemo(() => calcMacros(per100g, quantity, unit), [per100g, quantity, unit]);

  const handleLog = () => {
    onLog(mealKey, {
      id:        Date.now(),
      name:      food.description,
      brand:     food.brandName || null,
      ...macros,
      quantity:  parseFloat(quantity) || 0,
      unit,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
            {food.description}
          </h2>
          {food.brandName && (
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{food.brandName}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* USDA serving info */}
        {food.dataType === 'Branded' && food.servingSize && (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              USDA Serving Size
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mt-0.5">
              {food.servingSize}{food.servingSizeUnit || 'g'}
              {food.householdServingFullText ? ` · ${food.householdServingFullText}` : ''}
            </p>
          </div>
        )}

        {/* Amount input + unit picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">
            {unit === 'custom' ? 'Calories (enter directly)' : 'Quantity'}
          </label>
          <div className="flex gap-2 items-start">
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={unit === 'custom' ? 'kcal' : '100'}
              className={`${INPUT_CLS} w-28 flex-shrink-0`}
            />
            <div className="flex flex-wrap gap-1.5">
              {UNITS.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    unit === u
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          {unit === 'custom' && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
              Macros (protein, carbs, fat) won&apos;t be calculated in custom mode.
            </p>
          )}
        </div>

        {/* Macro preview */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">
            Nutrition Preview
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', value: macros.calories, unit: 'kcal', cls: 'text-brand' },
              { label: 'Protein',  value: macros.protein,  unit: 'g',    cls: 'text-blue-500' },
              { label: 'Carbs',    value: macros.carbs,    unit: 'g',    cls: 'text-green-500' },
              { label: 'Fat',      value: macros.fat,      unit: 'g',    cls: 'text-yellow-500' },
            ].map(({ label, value, unit: u, cls }) => (
              <div key={label}>
                <p className={`text-2xl font-black leading-none ${cls}`}>{value}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{u}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log button */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
        <button
          type="button"
          onClick={handleLog}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand/90 active:scale-95 transition-all"
        >
          <Check size={16} strokeWidth={2.5} />
          Log to {MEAL_LABELS[mealKey]}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Food({ date = today(), onDateChange }) {
  const [rawData,  setRawData]  = useDayData('food', date, DEFAULT_MEALS);
  const [targets,  setTargets]  = useGlobalData('macroTargets', DEFAULT_TARGETS);
  const [showSettings, setShowSettings] = useState(false);
  const [tempTargets, setTempTargets]   = useState(targets);

  // Modal state: null | mealKey
  const [searchMeal, setSearchMeal] = useState(null);
  // null | { food, mealKey }
  const [detailState, setDetailState] = useState(null);

  const { metrics } = calcWeekComparison('food', getThisWeekDates(), getLastWeekDates());

  // ── Normalise stored data (handles legacy flat-array migration) ──
  const meals = useMemo(() => normalizeMeals(rawData), [rawData]);

  const setMeals = useCallback((updater) => {
    setRawData(prev => {
      const current = normalizeMeals(prev);
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }, [setRawData]);

  // ── Daily totals ──
  const totals = useMemo(() =>
    MEAL_KEYS.reduce((acc, key) =>
      (meals[key] || []).reduce((a, item) => ({
        calories: a.calories + (item.calories || 0),
        protein:  a.protein  + (item.protein  || 0),
        carbs:    a.carbs    + (item.carbs    || 0),
        fat:      a.fat      + (item.fat      || 0),
      }), acc),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }),
  [meals]);

  // ── Food actions ──
  const addFood = useCallback((mealKey, entry) => {
    setMeals(prev => ({ ...prev, [mealKey]: [...(prev[mealKey] || []), entry] }));
  }, [setMeals]);

  const removeFood = useCallback((mealKey, id) => {
    setMeals(prev => ({ ...prev, [mealKey]: (prev[mealKey] || []).filter(i => i.id !== id) }));
  }, [setMeals]);

  // ── Modal handlers ──
  const openSearch = (mealKey) => setSearchMeal(mealKey);

  const handleSelectFood = (food) => {
    setDetailState({ food, mealKey: searchMeal });
    setSearchMeal(null);
  };

  const handleBack = () => {
    setSearchMeal(detailState?.mealKey ?? null);
    setDetailState(null);
  };

  const handleLog = (mealKey, entry) => {
    addFood(mealKey, entry);
    setDetailState(null);
  };

  const closeAll = () => { setSearchMeal(null); setDetailState(null); };

  const saveTargets = () => { setTargets(tempTargets); setShowSettings(false); };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <SectionHeader title="Nutrition" subtitle="Meals and macros">
          <div className="flex items-center gap-2">
            {onDateChange && <DateNav date={date} onChange={onDateChange} />}
            <button
              type="button"
              onClick={() => { setTempTargets(targets); setShowSettings(s => !s); }}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Settings size={12} strokeWidth={2.5} />
              {showSettings ? 'Close' : 'Targets'}
            </button>
          </div>
        </SectionHeader>

        {/* Targets settings */}
        {showSettings && (
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Daily Targets</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={tempTargets[key]}
                    onChange={e => setTempTargets(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    className={INPUT_CLS}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveTargets}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand/90 transition-colors"
            >
              Save Targets
            </button>
          </Card>
        )}

        {/* Daily Summary */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
            Daily Summary
          </p>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-5xl font-black tracking-tight text-brand">
              {totals.calories.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">
              / {targets.calories.toLocaleString()} kcal
            </span>
          </div>
          <div className="space-y-3.5">
            <MacroBar label="Calories" value={totals.calories}            target={targets.calories} barClass="bg-brand" />
            <MacroBar label="Protein"  value={Math.round(totals.protein)} target={targets.protein}  barClass="bg-blue-500" />
            <MacroBar label="Carbs"    value={Math.round(totals.carbs)}   target={targets.carbs}    barClass="bg-green-500" />
            <MacroBar label="Fat"      value={Math.round(totals.fat)}     target={targets.fat}      barClass="bg-yellow-400" />
          </div>

          {/* Macro totals row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Protein', value: Math.round(totals.protein), cls: 'text-blue-500' },
              { label: 'Carbs',   value: Math.round(totals.carbs),   cls: 'text-green-500' },
              { label: 'Fat',     value: Math.round(totals.fat),     cls: 'text-yellow-500' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className={`text-xl font-black ${cls}`}>{value}</p>
                <p className="text-xs font-medium text-gray-400 dark:text-slate-500">g</p>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 14-day chart */}
        <CaloriesChart calTarget={targets.calories} />

        {/* Week comparison */}
        <WeekComparison metrics={metrics} title="Nutrition — Week Comparison" />

        {/* Meal sections */}
        {MEAL_KEYS.map(key => (
          <MealSection
            key={key}
            mealKey={key}
            items={meals[key] || []}
            onAddFood={openSearch}
            onRemoveFood={removeFood}
          />
        ))}
      </div>

      {/* Food Search Modal */}
      {searchMeal && (
        <FoodSearchModal
          mealKey={searchMeal}
          onClose={closeAll}
          onSelectFood={handleSelectFood}
        />
      )}

      {/* Food Detail Modal */}
      {detailState && (
        <FoodDetailModal
          food={detailState.food}
          mealKey={detailState.mealKey}
          onBack={handleBack}
          onClose={closeAll}
          onLog={handleLog}
        />
      )}
    </>
  );
}
