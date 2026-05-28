import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Dumbbell, Check } from 'lucide-react';
import { useDayData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import { getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison } from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const BRAND = '#FC4C02';
const INPUT_CLS = 'border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand';

// chartKey changes whenever steps are saved so the chart re-reads localStorage
function StepsChart({ chartKey }) {
  const data = getSeriesData('steps', getPastDates(14));
  return (
    <Card className="p-5" key={chartKey}>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">14-Day Steps</p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              formatter={(v) => [v.toLocaleString(), 'Steps']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
            />
            <ReferenceLine y={10000} stroke={BRAND} strokeDasharray="4 4" strokeOpacity={0.4} />
            <Bar dataKey="value" fill={BRAND} radius={[3, 3, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function Steps({ date = today(), onDateChange }) {
  // Keyed by date in App.jsx — guaranteed fresh state on every date change.
  const [data, setData] = useDayData('steps', date, { steps: 0, activities: [] });

  const [stepsInput, setStepsInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');

  const { metrics } = calcWeekComparison('steps', getThisWeekDates(), getLastWeekDates());

  const handleSetSteps = (e) => {
    e.preventDefault();
    const n = parseInt(stepsInput, 10);
    if (isNaN(n) || n < 0) return;

    // Direct set — never accumulate.
    // Spread current data so activities are preserved.
    setData({ ...data, steps: n });

    setStepsInput('');
    setSaved(true);
    setChartKey((k) => k + 1); // force chart to re-read localStorage
    setTimeout(() => setSaved(false), 2000);
  };

  const addActivity = (e) => {
    e.preventDefault();
    if (!activityType.trim() || !duration.trim()) return;
    const newActivity = {
      id: Date.now(),
      type: activityType.trim(),
      duration: duration.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setData({ ...data, activities: [newActivity, ...data.activities] });
    setActivityType('');
    setDuration('');
  };

  const removeActivity = (id) =>
    setData({ ...data, activities: data.activities.filter((a) => a.id !== id) });

  const stepGoal = 10000;
  const steps = data.steps ?? 0;
  const pct = Math.min((steps / stepGoal) * 100, 100);

  return (
    <div className="space-y-4">
      <SectionHeader title="Activity" subtitle="Steps and workouts" />

      <StepsChart chartKey={chartKey} />

      <WeekComparison metrics={metrics} title="Activity — Week Comparison" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Steps input ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Steps</p>
            {onDateChange && <DateNav date={date} onChange={onDateChange} />}
          </div>

          {/* Current total for this day */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {steps.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">
              / {stepGoal.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mb-5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: BRAND }}
            />
          </div>

          {/* Set total — replaces, never adds */}
          <form onSubmit={handleSetSteps} className="flex gap-2">
            <input
              type="number"
              placeholder={steps > 0 ? `Current: ${steps.toLocaleString()}` : 'Enter total steps'}
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              min="0"
              className={`flex-1 ${INPUT_CLS}`}
            />
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${saved ? 'bg-green-500' : ''}`}
              style={!saved ? { backgroundColor: BRAND } : {}}
            >
              {saved ? <><Check size={14} strokeWidth={2.5} /> Saved</> : 'Save'}
            </button>
          </form>
        </Card>

        {/* ── Activity log ── */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Log Activity</p>
          <form onSubmit={addActivity} className="space-y-2 mb-4">
            <input
              type="text"
              placeholder="Activity type (e.g. Run, Yoga)"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className={`w-full ${INPUT_CLS}`}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Duration (e.g. 30 mins)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`flex-1 ${INPUT_CLS}`}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-sm font-bold text-white whitespace-nowrap"
                style={{ backgroundColor: BRAND }}
              >
                Log
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {data.activities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-slate-600">
                <Dumbbell size={24} strokeWidth={1.5} />
                <p className="text-xs font-medium mt-2">No activities logged</p>
              </div>
            )}
            {data.activities.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2.5"
              >
                <div>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{a.type}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 ml-2 font-medium">{a.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-slate-500">{a.time}</span>
                  <button
                    onClick={() => removeActivity(a.id)}
                    className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
