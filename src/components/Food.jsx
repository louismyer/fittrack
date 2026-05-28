import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus } from 'lucide-react';
import { useDayData, useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import { getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison } from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
const COLOR = '#2F9E44';
const INPUT = 'w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-300';

function MacroBar({ label, value, target, barClass }) {
  const pct = Math.min((value / target) * 100, 100);
  const over = value > target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        <span className={over ? 'text-red-500 font-bold' : 'font-semibold text-gray-600 dark:text-slate-300'}>
          {value} / {target}{label === 'Calories' ? ' kcal' : 'g'}
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${over ? 'bg-red-400' : barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }} />
            {calTarget > 0 && <ReferenceLine y={calTarget} stroke={COLOR} strokeDasharray="4 4" strokeOpacity={0.5} />}
            <Bar dataKey="value" fill={COLOR} radius={[3, 3, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function Food({ date = today(), onDateChange }) {
  const [meals, setMeals] = useDayData('food', date, []);
  const [targets, setTargets] = useGlobalData('macroTargets', DEFAULT_TARGETS);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [tempTargets, setTempTargets] = useState(targets);
  const { metrics } = calcWeekComparison('food', getThisWeekDates(), getLastWeekDates());

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0), fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setMeals((prev) => [{ id: Date.now(), name: form.name.trim(), calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0, carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const removeMeal = (id) => setMeals((prev) => prev.filter((m) => m.id !== id));
  const saveTargets = () => { setTargets(tempTargets); setShowSettings(false); };

  return (
    <div className="space-y-4">
      <SectionHeader title="Nutrition" subtitle="Meals and macros">
        <button onClick={() => { setTempTargets(targets); setShowSettings(!showSettings); }} className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
          {showSettings ? 'Close' : 'Targets'}
        </button>
      </SectionHeader>

      {showSettings && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Daily Targets</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">{label}</label>
                <input type="number" min="0" value={tempTargets[key]} onChange={(e) => setTempTargets((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} className={INPUT} />
              </div>
            ))}
          </div>
          <button onClick={saveTargets} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: COLOR }}>Save Targets</button>
        </Card>
      )}

      <CaloriesChart calTarget={targets.calories} />
      <WeekComparison metrics={metrics} title="Nutrition — Week Comparison" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Log Meal</p>
            {onDateChange && <DateNav date={date} onChange={onDateChange} />}
          </div>
          <form onSubmit={handleAdd} className="space-y-2">
            <input type="text" placeholder="Meal name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={INPUT} />
            <div className="grid grid-cols-2 gap-2">
              {[['calories','Calories'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([key, ph]) => (
                <input key={key} type="number" min="0" placeholder={ph} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className={INPUT} />
              ))}
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: COLOR }}>
              <Plus size={14} strokeWidth={2.5} /> Add Meal
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Today&apos;s Totals</p>
          <div className="space-y-3.5">
            <MacroBar label="Calories" value={totals.calories} target={targets.calories} barClass="bg-orange-400" />
            <MacroBar label="Protein"  value={totals.protein}  target={targets.protein}  barClass="bg-blue-500" />
            <MacroBar label="Carbs"    value={totals.carbs}    target={targets.carbs}    barClass="bg-green-500" />
            <MacroBar label="Fat"      value={totals.fat}      target={targets.fat}      barClass="bg-yellow-400" />
          </div>
        </Card>
      </div>

      {meals.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Meal Log</p>
          <div className="space-y-2">
            {meals.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{m.name}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{m.time}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs font-semibold text-orange-500">{m.calories} kcal</span>
                    <span className="text-xs font-semibold text-blue-500">P {m.protein}g</span>
                    <span className="text-xs font-semibold text-green-500">C {m.carbs}g</span>
                    <span className="text-xs font-semibold text-yellow-500">F {m.fat}g</span>
                  </div>
                </div>
                <button onClick={() => removeMeal(m.id)} className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors ml-2 text-xs">✕</button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
