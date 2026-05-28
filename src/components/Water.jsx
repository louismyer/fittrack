import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Plus, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useDayData, useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates } from '../utils/date';
import { getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison, readDay, getWaterMl } from '../utils/stats';
import { calcWaterTargetMl, waterTargetBreakdown } from '../utils/calories';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const COLOR = '#0C8CE9';
const ML_PRESETS = [250, 500, 750, 1000];

function fmt(ml) {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace(/\.?0+$/, '')}L`;
  return `${ml}ml`;
}

function WaterChart() {
  const data = getSeriesData('water', getPastDates(14)).map((d) => ({
    ...d,
    value: d.value > 0 ? d.value : null,
  }));
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">14-Day Intake (ml)</p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--chart-text)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}`}
            />
            <Tooltip
              formatter={(v) => [fmt(v), 'Intake']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
            />
            <Bar dataKey="value" fill={COLOR} radius={[3, 3, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SevenDayCompletion() {
  const dates = getPastDates(7);
  const entries = dates.map((d) => {
    const w = readDay('water', d);
    const intake = getWaterMl(w);
    const target = w?.target || 0;
    return { date: d, intake, target, pct: target > 0 ? Math.min(intake / target, 1) : null };
  }).filter((e) => e.target > 0 || e.intake > 0);

  if (entries.length === 0) return null;

  const withTarget = entries.filter((e) => e.pct !== null);
  const avgPct = withTarget.length > 0
    ? Math.round((withTarget.reduce((a, e) => a + e.pct, 0) / withTarget.length) * 100)
    : null;
  const daysMet = withTarget.filter((e) => e.pct >= 1).length;

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">7-Day Completion</p>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-3xl font-black tracking-tight" style={{ color: COLOR }}>
            {avgPct !== null ? `${avgPct}%` : '—'}
          </span>
          <span className="text-sm text-gray-400 dark:text-slate-500 font-medium ml-2">avg daily goal</span>
        </div>
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          {daysMet} / {withTarget.length} days met
        </span>
      </div>
      <div className="flex gap-1">
        {entries.slice(-7).map((e, i) => {
          const pct = e.pct ?? 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-sm overflow-hidden" style={{ height: 40 }}>
                <div
                  className="w-full rounded-sm transition-all duration-500"
                  style={{ height: `${Math.max(pct * 100, 2)}%`, backgroundColor: pct >= 1 ? '#22c55e' : COLOR, opacity: pct > 0 ? 0.85 : 0.2 }}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-600 font-medium" style={{ fontSize: 9 }}>
                {e.date.slice(5).replace('-', '/')}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Water({ date = today(), onDateChange }) {
  const [data, setData] = useDayData('water', date, { ml: 0, target: null });
  const [calorieProfile] = useGlobalData('calorieProfile', {});
  const [manualInput, setManualInput] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Pull weight from today's entry or most recent logged weight
  const weightKg = useMemo(() => {
    for (const d of getPastDates(30).reverse()) {
      const w = readDay('weight', d);
      if (w?.weight) return parseFloat(w.weight);
    }
    return null;
  }, []);

  const heightCm = parseFloat(calorieProfile?.height) || null;

  // Pull today's activities from steps data
  const stepsData = useMemo(() => readDay('steps', date), [date]);
  const activities = stepsData?.activities || [];

  // Dynamic target
  const target = useMemo(() => {
    const calc = calcWaterTargetMl(weightKg, heightCm, activities);
    return calc;
  }, [weightKg, heightCm, activities]);

  // Persist target alongside intake so historical completion can be calculated
  const intake = getWaterMl(data);

  const saveIntake = (newMl) => {
    const clamped = Math.max(0, newMl);
    setData({ ml: clamped, target: target ?? data.target ?? null });
  };

  const addMl = (amount) => saveIntake(intake + amount);
  const removeMl = (amount) => saveIntake(intake - amount);

  const handleManual = (e) => {
    e.preventDefault();
    const n = parseFloat(manualInput);
    if (!n || n <= 0) return;
    addMl(Math.round(n));
    setManualInput('');
  };

  const displayTarget = target ?? data.target ?? null;
  const pct = displayTarget ? Math.min(intake / displayTarget, 1) : 0;
  const pctDisplay = Math.round(pct * 100);

  const breakdown = useMemo(
    () => waterTargetBreakdown(weightKg, heightCm, activities),
    [weightKg, heightCm, activities]
  );

  const missingInputs = !weightKg || !heightCm;

  return (
    <div className="space-y-4">
      <SectionHeader title="Hydration" subtitle="Smart daily water recommendation" />

      {/* ── Target + Progress ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Today's Intake</p>
          {onDateChange && <DateNav date={date} onChange={onDateChange} />}
        </div>

        {/* Target headline */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight" style={{ color: COLOR }}>
                {fmt(intake)}
              </span>
              {displayTarget && (
                <span className="text-base font-semibold text-gray-400 dark:text-slate-500">
                  / {fmt(displayTarget)} target
                </span>
              )}
            </div>
            {displayTarget && (
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5">
                {pctDisplay}% of daily goal{intake >= displayTarget ? ' — goal reached! 🎉' : ''}
              </p>
            )}
          </div>

          {displayTarget && (
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-brand transition-colors"
            >
              <Info size={13} />
              How?
              {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 mb-5 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: displayTarget ? `${pct * 100}%` : '0%',
              backgroundColor: pct >= 1 ? '#22c55e' : COLOR,
            }}
          />
        </div>

        {/* Target breakdown */}
        {showBreakdown && breakdown.length > 0 && (
          <div className="mb-5 bg-blue-50 dark:bg-blue-900/10 rounded-xl px-4 py-3 space-y-1.5">
            {breakdown.map((line, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-slate-400 font-medium">{line.label}</span>
                <span className="font-bold" style={{ color: COLOR }}>+{fmt(line.ml)}</span>
              </div>
            ))}
            <div className="border-t border-blue-200 dark:border-blue-800 pt-1.5 flex justify-between text-xs font-black">
              <span className="text-gray-700 dark:text-slate-300">Recommended</span>
              <span style={{ color: COLOR }}>{displayTarget ? fmt(displayTarget) : '—'}</span>
            </div>
          </div>
        )}

        {missingInputs && (
          <div className="mb-4 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2.5 text-amber-700 dark:text-amber-400">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              Set your <strong>weight</strong> in the Weight tab and <strong>height</strong> in Calories → Profile to get a personalised target.
            </span>
          </div>
        )}

        {/* Quick-add buttons */}
        <div className="flex gap-2 flex-wrap mb-3">
          {ML_PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => addMl(ml)}
              className="flex-1 min-w-0 py-2.5 rounded-lg text-sm font-bold border-2 transition-all"
              style={{ borderColor: COLOR, color: COLOR }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = COLOR; }}
            >
              +{fmt(ml)}
            </button>
          ))}
        </div>

        {/* Manual entry + undo */}
        <div className="flex gap-2">
          <form onSubmit={handleManual} className="flex gap-2 flex-1">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom ml"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: COLOR }}
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </form>
          <button
            onClick={() => removeMl(250)}
            disabled={intake <= 0}
            title="Remove 250ml"
            className="px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-30"
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Intake dots (each dot = 250ml) */}
        {displayTarget && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-2">
              Each drop = 250ml
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: Math.ceil(displayTarget / 250) }).map((_, i) => {
                const filled = i < Math.floor(intake / 250);
                return (
                  <button
                    key={i}
                    onClick={() => filled ? removeMl(250) : addMl(250)}
                    title={filled ? 'Remove 250ml' : 'Add 250ml'}
                    className="w-6 h-6 rounded-full transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: filled ? COLOR : 'transparent',
                      border: `2px solid ${filled ? COLOR : 'var(--chart-grid)'}`,
                    }}
                  >
                    {filled && <Droplets size={10} className="text-white m-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── 7-day completion ── */}
      <SevenDayCompletion />

      {/* ── 14-day chart ── */}
      <WaterChart />

      {/* ── Week comparison ── */}
      <WeekComparison
        metrics={calcWeekComparison('water', getThisWeekDates(), getLastWeekDates()).metrics}
        title="Hydration — Week Comparison"
      />
    </div>
  );
}
