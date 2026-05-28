import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useDayData } from '../hooks/useLocalStorage';
import { today, getPastDates, calcHoursSlept } from '../utils/date';
import { getSeriesData, getThisWeekDates, getLastWeekDates, calcWeekComparison } from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const COLOR_GOOD = '#4C6EF5';
const COLOR_OK   = '#A5B4FC';
const COLOR_POOR = '#FCA5A5';
const QUALITY_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'OK', 4: 'Good', 5: 'Great' };
const INPUT = 'w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300';

function getSleepColor(h) {
  if (!h) return 'var(--chart-grid)';
  if (h >= 7) return COLOR_GOOD;
  if (h >= 6) return COLOR_OK;
  return COLOR_POOR;
}

function SleepChart() {
  const data = getSeriesData('sleep', getPastDates(14));
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">14-Night History</p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v}h`, 'Sleep']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }} />
            <ReferenceLine y={7} stroke={COLOR_GOOD} strokeDasharray="4 4" strokeOpacity={0.5} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((e, i) => <Cell key={i} fill={getSleepColor(e.value)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-5 mt-3">
        {[[COLOR_GOOD, '7+ hrs'], [COLOR_OK, '6–7 hrs'], [COLOR_POOR, '< 6 hrs']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: c }} />{l}
          </span>
        ))}
      </div>
    </Card>
  );
}

export default function Sleep({ date = today(), onDateChange }) {
  const [data, setData] = useDayData('sleep', date, { bedtime: '', waketime: '', quality: 0 });
  const [saved, setSaved] = useState(false);
  const { metrics } = calcWeekComparison('sleep', getThisWeekDates(), getLastWeekDates());
  const hours = calcHoursSlept(data.bedtime, data.waketime);

  const handleSave = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-4">
      <SectionHeader title="Sleep" subtitle="Rest and recovery tracking" />
      <SleepChart />
      <WeekComparison metrics={metrics} title="Sleep — Week Comparison" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Log Sleep</p>
            {onDateChange && <DateNav date={date} onChange={onDateChange} />}
          </div>
          {hours && (
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-5xl font-black tracking-tight" style={{ color: COLOR_GOOD }}>{hours}</span>
              <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">hrs</span>
              {data.quality > 0 && <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">{QUALITY_LABELS[data.quality]}</span>}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Bedtime</label>
                <input type="time" value={data.bedtime} onChange={(e) => setData((p) => ({ ...p, bedtime: e.target.value }))} className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Wake Time</label>
                <input type="time" value={data.waketime} onChange={(e) => setData((p) => ({ ...p, waketime: e.target.value }))} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">Quality</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((q) => (
                  <button key={q} type="button" onClick={() => setData((p) => ({ ...p, quality: q }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${data.quality === q ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-indigo-300'}`}>
                    {q}
                  </button>
                ))}
              </div>
              {data.quality > 0 && <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-1.5 text-center">{QUALITY_LABELS[data.quality]}</p>}
            </div>
            <button type="submit" className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}>
              {saved ? 'Saved' : 'Save Entry'}
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Last Night</p>
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-4" style={{ backgroundColor: `${COLOR_GOOD}15` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: COLOR_GOOD }}>Duration</p>
              <p className="text-3xl font-black tracking-tight" style={{ color: COLOR_GOOD }}>{hours ? `${hours}h` : '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['Bedtime', data.bedtime], ['Wake', data.waketime]].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-3">
                  <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{l}</p>
                  <p className="text-lg font-black text-gray-700 dark:text-white mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
