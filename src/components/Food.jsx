import { useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Settings } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useDayData, useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import {
  getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison,
} from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import DateNav from './ui/DateNav';
import WeekComparison from './WeekComparison';

import { MEAL_KEYS, DEFAULT_TARGETS, INPUT_CLS } from './diary/constants';
import { normalizeDayData, normalizeOffProduct, getRecentFoods, calcMacros, getOffPer100g } from './diary/nutrition';
import DailySummaryBar from './diary/DailySummaryBar';
import WaterWidget from './diary/WaterWidget';
import MealSection from './diary/MealSection';
import LogFab from './diary/LogFab';
import MealSelector from './diary/MealSelector';
import FoodSearchModal from './diary/FoodSearchModal';
import FoodDetailModal from './diary/FoodDetailModal';
import QuickAddModal from './diary/QuickAddModal';
import RecentFoodsModal from './diary/RecentFoodsModal';

function CaloriesChart({ calTarget }) {
  const data = getSeriesData('food', getPastDates(14));
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">14-Day Calories</p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
            <Tooltip
              formatter={(v) => [`${v} kcal`, 'Calories']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
            />
            {calTarget > 0 && (
              <ReferenceLine y={calTarget} stroke="#4F46E5" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            <Bar dataKey="value" fill="#4F46E5" radius={[3, 3, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function Food({ date = today(), onDateChange }) {
  const [rawData, setRawData] = useDayData('food', date, normalizeDayData(null));
  const [targets, setTargets] = useGlobalData('macroTargets', DEFAULT_TARGETS);
  const [showSettings, setShowSettings] = useState(false);
  const [tempTargets, setTempTargets] = useState(targets);

  const [pendingMethod, setPendingMethod] = useState(null);
  const [searchMeal, setSearchMeal] = useState(null);
  const [quickAddMeal, setQuickAddMeal] = useState(null);
  const [quickAddEdit, setQuickAddEdit] = useState(null);
  const [recentMeal, setRecentMeal] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMeal, setScanMeal] = useState(null);
  const [detailState, setDetailState] = useState(null);

  const { metrics } = calcWeekComparison('food', getThisWeekDates(), getLastWeekDates());
  const dayData = useMemo(() => normalizeDayData(rawData), [rawData]);
  const { water, ...meals } = dayData;

  const setDayData = useCallback((updater) => {
    setRawData(prev => {
      const current = normalizeDayData(prev);
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }, [setRawData]);

  const totals = useMemo(() =>
    MEAL_KEYS.reduce((acc, key) =>
      (meals[key] || []).reduce((a, item) => ({
        calories: a.calories + (item.calories || 0),
        protein: a.protein + (item.protein || 0),
        carbs: a.carbs + (item.carbs || 0),
        fat: a.fat + (item.fat || 0),
      }), acc),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }),
  [meals]);

  const recentFoods = useMemo(() => getRecentFoods(meals), [meals]);

  const addFood = useCallback((mealKey, entry) => {
    setDayData(prev => ({ ...prev, [mealKey]: [...(prev[mealKey] || []), entry] }));
  }, [setDayData]);

  const updateFood = useCallback((mealKey, entry) => {
    setDayData(prev => ({
      ...prev,
      [mealKey]: (prev[mealKey] || []).map(i => i.id === entry.id ? entry : i),
    }));
  }, [setDayData]);

  const removeFood = useCallback((mealKey, id) => {
    setDayData(prev => ({ ...prev, [mealKey]: (prev[mealKey] || []).filter(i => i.id !== id) }));
  }, [setDayData]);

  const setWater = useCallback((newWater) => {
    setDayData(prev => ({ ...prev, water: newWater }));
  }, [setDayData]);

  const closeAll = () => {
    setPendingMethod(null);
    setSearchMeal(null);
    setQuickAddMeal(null);
    setQuickAddEdit(null);
    setRecentMeal(null);
    setShowScanner(false);
    setScanMeal(null);
    setDetailState(null);
  };

  const openWithMeal = (method, mealKey) => {
    setPendingMethod(null);
    if (method === 'search') setSearchMeal(mealKey);
    else if (method === 'scan') { setScanMeal(mealKey); setShowScanner(true); }
    else if (method === 'quick-add') setQuickAddMeal(mealKey);
    else if (method === 'recent') setRecentMeal(mealKey);
  };

  const handleFabAction = (method) => setPendingMethod(method);
  const handleMealSelect = (mealKey) => openWithMeal(pendingMethod, mealKey);
  const handleMealAdd = (mealKey) => openWithMeal('search', mealKey);

  const handleSearchScan = () => {
    const meal = searchMeal;
    setSearchMeal(null);
    setScanMeal(meal);
    setShowScanner(true);
  };

  const handleSelectFood = (product) => {
    setDetailState({ product, mealKey: searchMeal, editItem: null });
    setSearchMeal(null);
  };

  const handleBarcodeScan = useCallback(async (barcode) => {
    setShowScanner(false);
    const mealKey = scanMeal;
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity`);
      const json = await res.json();
      if (json.product?.product_name || json.product?.product_name_en) {
        setDetailState({ product: normalizeOffProduct(json.product, barcode), mealKey, editItem: null });
      } else {
        setSearchMeal(mealKey);
      }
    } catch {
      setSearchMeal(mealKey);
    }
    setScanMeal(null);
  }, [scanMeal]);

  const handleLog = (mealKey, entry) => {
    if (detailState?.editItem) updateFood(mealKey, entry);
    else addFood(mealKey, entry);
    setDetailState(null);
  };

  const handleQuickLog = (mealKey, entry) => {
    if (quickAddEdit) updateFood(mealKey, entry);
    else addFood(mealKey, entry);
    setQuickAddMeal(null);
    setQuickAddEdit(null);
  };

  const handleRecentSelect = (item) => {
    const mealKey = recentMeal;
    const { mealKey: _mk, ...rest } = item;
    if (rest.offProduct) {
      const per100 = getOffPer100g(rest.offProduct);
      const macros = calcMacros(per100, rest.quantity, rest.unit, rest.offProduct);
      addFood(mealKey, {
        ...rest,
        id: Date.now(),
        ...macros,
        timestamp: new Date().toISOString(),
      });
    } else {
      addFood(mealKey, { ...rest, id: Date.now(), timestamp: new Date().toISOString() });
    }
    setRecentMeal(null);
  };

  const handleEditFood = (mealKey, item) => {
    if (!item.offProduct) {
      setQuickAddEdit({ mealKey, item });
      return;
    }
    setDetailState({ product: item.offProduct, mealKey, editItem: item });
  };

  const handleDetailBack = () => {
    if (detailState?.editItem) {
      setDetailState(null);
    } else {
      setSearchMeal(detailState?.mealKey ?? null);
      setDetailState(null);
    }
  };

  const saveTargets = () => { setTargets(tempTargets); setShowSettings(false); };

  const hasModal = pendingMethod || searchMeal || quickAddMeal || quickAddEdit || recentMeal || showScanner || detailState;

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Nutrition" subtitle="Meals and macros" />

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
            <button onClick={saveTargets} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand/90 transition-colors">
              Save Targets
            </button>
          </Card>
        )}

        <DailySummaryBar
          totals={totals}
          targets={targets}
          headerActions={
            <>
              {onDateChange && <DateNav date={date} onChange={onDateChange} />}
              <button
                type="button"
                onClick={() => { setTempTargets(targets); setShowSettings(s => !s); }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Settings size={12} strokeWidth={2.5} />
                {showSettings ? 'Close' : 'Targets'}
              </button>
            </>
          }
        />

        <WaterWidget water={water} onChange={setWater} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MEAL_KEYS.map(key => (
            <MealSection
              key={key}
              mealKey={key}
              items={meals[key] || []}
              onAddFood={handleMealAdd}
              onRemoveFood={removeFood}
              onEditFood={handleEditFood}
            />
          ))}
        </div>

        <CaloriesChart calTarget={targets.calories} />
        <WeekComparison metrics={metrics} title="Nutrition — Week Comparison" />
      </div>

      {!hasModal && <LogFab onAction={handleFabAction} />}

      {pendingMethod && (
        <MealSelector onSelect={handleMealSelect} onClose={() => setPendingMethod(null)} />
      )}

      {searchMeal && (
        <FoodSearchModal
          mealKey={searchMeal}
          onClose={closeAll}
          onSelectFood={handleSelectFood}
          onScanBarcode={handleSearchScan}
        />
      )}

      {quickAddMeal && (
        <QuickAddModal mealKey={quickAddMeal} onClose={closeAll} onLog={handleQuickLog} />
      )}

      {quickAddEdit && (
        <QuickAddModal
          mealKey={quickAddEdit.mealKey}
          editItem={quickAddEdit.item}
          onClose={closeAll}
          onLog={handleQuickLog}
        />
      )}

      {recentMeal && (
        <RecentFoodsModal
          mealKey={recentMeal}
          recentFoods={recentFoods}
          onClose={closeAll}
          onSelect={handleRecentSelect}
        />
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => { setShowScanner(false); setScanMeal(null); }} />
      )}

      {detailState && (
        <FoodDetailModal
          product={detailState.product}
          mealKey={detailState.mealKey}
          editItem={detailState.editItem}
          onBack={handleDetailBack}
          onClose={closeAll}
          onLog={handleLog}
        />
      )}
    </>
  );
}
