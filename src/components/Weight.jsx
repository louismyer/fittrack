import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDayData, useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import { getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison } from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const COLOR = '#7048E8';
const INPUT = 'w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300';

function WeightChart({ unit }) {
  const dates = getPastDates(30);
  const raw = getSeriesData('weight', dates);
  const data = raw.map((d) => ({ ...d, value: d.value != null && unit === 'lbs' ? +(d.value * 2.20462).toFixed(1) : d.value }));
  const values = data.filter((d) => d.value != null).map((d) => d.value);
  const min = values.length ? Math.floor(Math.min(...values)) - 2 : 0;
  const max = values.length ? Math.ceil(Math.max(...values)) + 2 : 100;

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">30-Day Weight ({unit})</p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis domain={[min, max]} tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [v != null ? `${v} ${unit}` : '—', 'Weight']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }} />
            <Line type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2.5} dot={{ r: 3, fill: COLOR, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function Weight({ date = today(), onDateChange }) {
  const [data, setData] = useDayData('weight', date, { weight: '' });
  const [unit, setUnit] = useGlobalData('weightUnit', 'kg');
  const [saved, setSaved] = useState(false);
  const { metrics } = calcWeekComparison('weight', getThisWeekDates(), getLastWeekDates());

  const handleSave = (e) => {
    e.preventDefault();
    const w = parseFloat(data.weight);
    if (!w || w <= 0) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayWeight = data.weight ? (unit === 'lbs' ? (parseFloat(data.weight) * 2.20462).toFixed(1) : data.weight) : '';

  return (
    <div className="space-y-4">
      <SectionHeader title="Weight" subtitle="Progress over time">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 text-xs">
          {['kg', 'lbs'].map((u) => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-3 py-1.5 font-bold uppercase tracking-wide transition-colors ${unit === u ? 'text-white' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              style={unit === u ? { backgroundColor: COLOR } : {}}>
              {u}
            </button>
          ))}
        </div>
      </SectionHeader>

      <WeightChart unit={unit} />
      <WeekComparison metrics={metrics} title="Weight — Week Comparison" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Log Weight</p>
            {onDateChange && <DateNav date={date} onChange={onDateChange} />}
          </div>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number" step="0.1" min="20" max="500"
                placeholder={unit === 'kg' ? 'e.g. 78.5' : 'e.g. 173.1'}
                value={unit === 'kg' ? data.weight : displayWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const inKg = unit === 'lbs' ? (val / 2.20462).toFixed(2) : e.target.value;
                  setData((p) => ({ ...p, weight: inKg }));
                }}
                className={INPUT}
              />
              <span className="flex items-center px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold text-gray-500 dark:text-slate-400">{unit}</span>
            </div>
            <button type="submit" className={`w-full py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${saved ? 'bg-green-500' : ''}`} style={!saved ? { backgroundColor: COLOR } : {}}>
              {saved ? 'Saved!' : 'Log Weight'}
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Today&apos;s Entry</p>
          {data.weight ? (
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-black tracking-tight" style={{ color: COLOR }}>
                {unit === 'lbs' ? (parseFloat(data.weight) * 2.20462).toFixed(1) : data.weight}
              </span>
              <span className="text-sm font-semibold text-gray-400 dark:text-slate-500 mt-1">{unit}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-slate-600">
              <p className="text-xs font-medium">No weight logged today</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
