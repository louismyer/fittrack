import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { Activity, Moon, Utensils, Droplets, Scale, Flame, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { today, calcHoursSlept } from '../utils/date';
import { getThisWeekDates, getSeriesData, readDay, readGlobal, calcWeekComparison, getLastWeekDates, getWaterMl } from '../utils/stats';
import { mifflinBMR, calcActiveCalories, calcNEATCalories } from '../utils/calories';

const SECTIONS = [
  { id: 'steps',    label: 'Activity',   Icon: Activity,  color: '#FC4C02' },
  { id: 'sleep',    label: 'Sleep',      Icon: Moon,      color: '#4C6EF5' },
  { id: 'food',     label: 'Nutrition',  Icon: Utensils,  color: '#2F9E44' },
  { id: 'water',    label: 'Hydration',  Icon: Droplets,  color: '#0C8CE9' },
  { id: 'weight',   label: 'Weight',     Icon: Scale,     color: '#7048E8' },
  { id: 'calories', label: 'Calories',   Icon: Flame,     color: '#EF4444' },
];

function MiniBarChart({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={52}>
      <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value > 0 ? color : 'var(--chart-grid)'} fillOpacity={entry.value > 0 ? 0.9 : 1} />
          ))}
        </Bar>
        <Tooltip
          formatter={(v) => [v, '']}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '4px 10px', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniLineChart({ data, color }) {
  const withData = data.filter((d) => d.value != null);
  if (withData.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs font-medium uppercase tracking-wide text-gray-300 dark:text-slate-600" style={{ height: 52 }}>
        No data
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={52}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }} connectNulls />
        <Tooltip
          formatter={(v) => [v, '']}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '4px 10px', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function getTodayStat(sectionId) {
  const d = today();
  switch (sectionId) {
    case 'steps': {
      const data = readDay('steps', d);
      return { primary: (data?.steps || 0).toLocaleString(), unit: 'steps', sub: 'Goal: 10,000' };
    }
    case 'sleep': {
      const data = readDay('sleep', d);
      const hours = data ? calcHoursSlept(data.bedtime, data.waketime) : null;
      return { primary: hours || '—', unit: hours ? 'hrs' : '', sub: hours ? `Quality ${data?.quality || '—'}/5` : 'Not logged' };
    }
    case 'food': {
      const meals = readDay('food', d);
      const cals = Array.isArray(meals) ? meals.reduce((a, m) => a + (m.calories || 0), 0) : 0;
      return { primary: cals ? cals.toLocaleString() : '—', unit: cals ? 'kcal' : '', sub: 'Consumed' };
    }
    case 'water': {
      const data = readDay('water', d);
      const ml = getWaterMl(data);
      const target = data?.target || null;
      const litres = ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : ml > 0 ? `${ml}ml` : '0';
      const targetStr = target ? (target >= 1000 ? `${(target / 1000).toFixed(1)}L` : `${target}ml`) : null;
      return {
        primary: litres,
        unit: targetStr ? `/ ${targetStr}` : '',
        sub: target ? 'of daily target' : 'logged today',
      };
    }
    case 'weight': {
      const data = readDay('weight', d);
      const unit = readGlobal('weightUnit', 'kg');
      const w = data?.weight;
      return { primary: w ? (unit === 'kg' ? `${w}` : `${(w * 2.20462).toFixed(1)}`) : '—', unit: w ? unit : '', sub: w ? 'Today' : 'Not logged' };
    }
    case 'calories': {
      const stepsD  = readDay('steps', d);
      const weightD = readDay('weight', d);
      const profile = readGlobal('calorieProfile', null);
      const wkg  = weightD?.weight;
      const hcm  = profile ? parseFloat(profile.height) || null : null;
      const bmr  = profile ? mifflinBMR(wkg, hcm, parseInt(profile.age), profile.sex) : null;
      const active = calcActiveCalories(stepsD?.activities || [], wkg);
      const neat   = calcNEATCalories(stepsD?.steps || 0, wkg, hcm);
      const total  = bmr ? bmr + active + neat : null;
      return { primary: total ? total.toLocaleString() : '—', unit: total ? 'kcal' : '', sub: 'Total burnt' };
    }
    default:
      return { primary: '—', unit: '', sub: '' };
  }
}

function getWeekChange(sectionId) {
  const thisDates = getThisWeekDates();
  const lastDates = getLastWeekDates();
  const comparison = calcWeekComparison(sectionId, thisDates, lastDates);
  const first = comparison.metrics?.[0];
  if (!first || first.lastVal == null || first.lastVal === 0 || first.thisVal == null) return null;
  const pct = ((first.thisVal - first.lastVal) / Math.abs(first.lastVal)) * 100;
  return { pct, higherIsBetter: first.higherIsBetter, isWeight: !!first.isWeight };
}

function ChangeBadge({ change }) {
  if (!change) return null;
  const positive = change.pct > 0;
  const isGood = change.isWeight ? null : positive === change.higherIsBetter;
  const colorClass = change.isWeight
    ? 'text-gray-500 dark:text-slate-400'
    : isGood ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const Icon = change.pct === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${colorClass}`}>
      <Icon size={13} strokeWidth={2.5} />
      {Math.abs(change.pct).toFixed(1)}%
    </span>
  );
}

function DashboardCard({ section, onNavigate }) {
  const thisDates = getThisWeekDates();
  const seriesData = section.id === 'calories' ? [] : getSeriesData(section.id, thisDates);
  const todayStat = getTodayStat(section.id);
  const weekChange = section.id === 'calories' ? null : getWeekChange(section.id);
  const { Icon } = section;

  return (
    <button
      onClick={() => onNavigate(section.id)}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none hover:shadow-md dark:hover:ring-1 dark:hover:ring-slate-700 transition-all duration-200 text-left w-full group overflow-hidden"
    >
      <div className="h-1 w-full" style={{ backgroundColor: section.color }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${section.color}18` }}>
              <Icon size={15} style={{ color: section.color }} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">{section.label}</span>
          </div>
          <ChangeBadge change={weekChange} />
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              {todayStat.primary}
            </span>
            {todayStat.unit && (
              <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">{todayStat.unit}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mt-1">{todayStat.sub}</p>
        </div>

        {seriesData.length > 0 ? (
          section.id === 'weight'
            ? <MiniLineChart data={seriesData} color={section.color} />
            : <MiniBarChart data={seriesData} color={section.color} />
        ) : (
          <div style={{ height: 52 }} />
        )}

        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 group-hover:text-brand transition-colors">View & Log</span>
          <ArrowRight size={12} className="text-gray-400 dark:text-slate-500 group-hover:text-brand transition-colors" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({ onNavigate }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Today&apos;s Overview</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Select a stat to view details and log entries</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {SECTIONS.map((section) => (
          <DashboardCard key={section.id} section={section} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
