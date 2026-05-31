import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { Settings, Flame, Zap, Footprints, TrendingUp, Info } from 'lucide-react';
import { useGlobalData } from '../hooks/useLocalStorage';
import { today, getPastDates, shortDate } from '../utils/date';
import { readDay } from '../utils/stats';
import {
  mifflinBMR, calcActiveCalories, calcNEATCalories,
  buildHistory, getAdaptiveTDEE, getMET, parseDurationMinutes,
} from '../utils/calories';
import { getThisWeekDates, getLastWeekDates, getFlatMeals } from '../utils/stats';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WeekComparison from './WeekComparison';
import DateNav from './ui/DateNav';

const COLOR = '#EF4444';
const COLOR_CONSUMED = '#10b981';

const DEFAULT_PROFILE = { height: '', age: '', sex: 'male', activityLevel: 'sedentary' };

const ACTIVITY_MULTIPLIERS = {
  sedentary:   { label: 'Sedentary (desk job, little exercise)', factor: 1.2 },
  light:       { label: 'Lightly active (1–3 days/week)',        factor: 1.375 },
  moderate:    { label: 'Moderately active (3–5 days/week)',     factor: 1.55 },
  active:      { label: 'Very active (6–7 days/week)',           factor: 1.725 },
  extra:       { label: 'Extra active (physical job + gym)',     factor: 1.9 },
};

function StatTile({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color }} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          {value ?? '—'}
        </span>
        {value != null && <span className="text-xs font-bold text-gray-400 dark:text-slate-500">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

function BurnChart({ dates }) {
  const data = dates.map((d) => {
    const label = shortDate(d);
    const stepsData = readDay('steps', d);
    const foodData  = readDay('food', d);
    const weightDay = readDay('weight', d);
    const profile   = (() => { try { return JSON.parse(localStorage.getItem('ft_global_calorieProfile')); } catch { return null; } })();

    const weightKg = weightDay?.weight;
    const steps    = stepsData?.steps || 0;
    const consumed = getFlatMeals(foodData).reduce((a, m) => a + (m.calories || 0), 0);

    const profileHeight = profile ? parseFloat(profile.height) : null;
    const bmr    = profile ? (mifflinBMR(weightKg, profileHeight, parseInt(profile.age), profile.sex) || 0) : 0;
    const active = calcActiveCalories(stepsData?.activities || [], weightKg);
    const neat   = calcNEATCalories(steps, weightKg, profileHeight);
    const burnt  = bmr + active + neat;

    return { label, burnt: burnt || null, consumed: consumed || null };
  });

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">
        14-Day Calories: Burnt vs Consumed
      </p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
              formatter={(v, name) => [`${v} kcal`, name === 'burnt' ? 'Burnt' : 'Consumed']}
            />
            <Legend formatter={(v) => v === 'burnt' ? 'Burnt' : 'Consumed'} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="burnt" fill={COLOR} radius={[3, 3, 0, 0]} fillOpacity={0.85} />
            <Line type="monotone" dataKey="consumed" stroke={COLOR_CONSUMED} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AdaptiveStatus({ adaptive, formulaBMR }) {
  if (!formulaBMR) return null;

  const pct = adaptive ? Math.round(adaptive.confidence * 100) : 0;
  const needed = 14;
  const have = adaptive?.dataPoints || 0;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <TrendingUp size={15} className="text-amber-500" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Adaptive BMR Calibration</p>
          {pct === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Log weight + meals for at least {needed} days to enable personalised estimation.
              Currently have {have} / {needed} days of data.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {have} days of data collected.
              {adaptive?.tdee && ` Estimated actual TDEE: ${adaptive.tdee.toLocaleString()} kcal/day`}
              {adaptive?.confidence >= 0.9 ? ' (high confidence)' : ' — keep logging for higher accuracy.'}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#22c55e' : '#f59e0b' }}
              />
            </div>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 w-8 text-right">{pct}%</span>
          </div>
        </div>
      </div>
      {adaptive?.tdee && adaptive.confidence >= 0.5 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">Formula BMR</p>
            <p className="text-lg font-black text-gray-500 dark:text-slate-400">{formulaBMR.toLocaleString()} <span className="text-xs font-bold">kcal</span></p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">Data-derived TDEE</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{adaptive.tdee.toLocaleString()} <span className="text-xs font-bold text-gray-400">kcal</span></p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Calories({ date = today(), onDateChange }) {
  const [profile, setProfile] = useGlobalData('calorieProfile', DEFAULT_PROFILE);
  const [showProfile, setShowProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  const stepsData = readDay('steps', date);
  const weightData = readDay('weight', date);
  const foodData   = readDay('food',  date);

  const latestWeight = useMemo(() => {
    if (weightData?.weight) return weightData.weight;
    const dates = getPastDates(30).reverse();
    for (const d of dates) {
      const wd = readDay('weight', d);
      if (wd?.weight) return wd.weight;
    }
    return null;
  }, [weightData]);

  const weightKg     = latestWeight;
  const steps        = stepsData?.steps || 0;
  const activities   = stepsData?.activities || [];
  const consumed     = getFlatMeals(foodData).reduce((a, m) => a + (m.calories || 0), 0);

  const heightCm       = parseFloat(profile.height) || null;
  const formulaBMR     = mifflinBMR(weightKg, heightCm, parseInt(profile.age), profile.sex);
  const activeCalories = calcActiveCalories(activities, weightKg);
  const neatCalories   = calcNEATCalories(steps, weightKg, heightCm);
  const totalBurnt     = formulaBMR ? formulaBMR + activeCalories + neatCalories : null;
  const netBalance     = totalBurnt != null && consumed > 0 ? consumed - totalBurnt : null;

  const { weightHistory, caloriesHistory } = useMemo(() => buildHistory(30), []);
  const adaptive = useMemo(() => getAdaptiveTDEE(weightHistory, caloriesHistory), [weightHistory, caloriesHistory]);

  const saveProfile = () => { setProfile(tempProfile); setShowProfile(false); };

  // Week comparison metrics
  const thisWeek = getThisWeekDates();
  const lastWeek = getLastWeekDates();
  const weekMetrics = useMemo(() => {
    function weekTotalBurnt(dates) {
      return dates.map((d) => {
        const s  = readDay('steps', d);
        const wd = readDay('weight', d);
        const wkg = wd?.weight || latestWeight;
        const hcm = parseFloat(profile.height) || null;
        const bmr = mifflinBMR(wkg, hcm, parseInt(profile.age), profile.sex) || 0;
        const act = calcActiveCalories(s?.activities || [], wkg);
        const nat = calcNEATCalories(s?.steps || 0, wkg, hcm);
        return bmr + act + nat;
      });
    }
    const thisVals = weekTotalBurnt(thisWeek);
    const lastVals = weekTotalBurnt(lastWeek);
    const thisAvg  = Math.round(thisVals.reduce((a, b) => a + b, 0) / thisVals.length);
    const lastAvg  = Math.round(lastVals.reduce((a, b) => a + b, 0) / lastVals.length);
    return [{ label: 'Avg Calories Burnt / Day', thisVal: thisAvg || null, lastVal: lastAvg || null, unit: 'kcal', higherIsBetter: true }];
  }, [profile, latestWeight]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Calories Burnt" subtitle="Energy expenditure breakdown">
        <button
          onClick={() => { setTempProfile(profile); setShowProfile(!showProfile); }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Settings size={12} strokeWidth={2.5} />
          Profile
        </button>
      </SectionHeader>

      {/* Profile settings */}
      {showProfile && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Your Profile</p>
          {!weightKg && (
            <div className="flex items-center gap-2 mb-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              <Info size={13} />
              Log your weight in the Weight tab to enable BMR calculation.
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Height (cm)</label>
              <input
                type="number"
                min="100" max="250"
                placeholder="e.g. 178"
                value={tempProfile.height}
                onChange={(e) => setTempProfile((p) => ({ ...p, height: e.target.value }))}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Age</label>
              <input
                type="number"
                min="10" max="100"
                placeholder="e.g. 32"
                value={tempProfile.age}
                onChange={(e) => setTempProfile((p) => ({ ...p, age: e.target.value }))}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Biological Sex</label>
              <div className="flex gap-2">
                {['male', 'female'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTempProfile((p) => ({ ...p, sex: s }))}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold border-2 capitalize transition-colors ${
                      tempProfile.sex === s
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-red-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Activity Level</label>
              <select
                value={tempProfile.activityLevel}
                onChange={(e) => setTempProfile((p) => ({ ...p, activityLevel: e.target.value }))}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300 appearance-none"
              >
                {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={saveProfile} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
            Save Profile
          </button>
        </Card>
      )}

      {/* Today's burn tiles */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Energy Expenditure</p>
          {onDateChange && <DateNav date={date} onChange={onDateChange} />}
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <StatTile
            icon={Flame}
            label="Resting (BMR)"
            value={formulaBMR?.toLocaleString()}
            unit="kcal"
            color="#EF4444"
            sub={formulaBMR ? 'Mifflin-St Jeor' : 'Set profile above'}
          />
          <StatTile
            icon={Zap}
            label="Active"
            value={activities.length ? activeCalories.toLocaleString() : '—'}
            unit="kcal"
            color="#FC4C02"
            sub={activities.length ? `${activities.length} activit${activities.length > 1 ? 'ies' : 'y'}` : 'No activities today'}
          />
          <StatTile
            icon={Footprints}
            label="NEAT (Steps)"
            value={steps > 0 && weightKg && heightCm ? neatCalories.toLocaleString() : '—'}
            unit="kcal"
            color="#f59e0b"
            sub={
              !weightKg || !heightCm
                ? 'Set weight & height in profile'
                : steps > 0
                  ? `${steps.toLocaleString()} steps`
                  : 'No steps logged'
            }
          />
          <StatTile
            icon={Flame}
            label="Total Burnt"
            value={totalBurnt?.toLocaleString()}
            unit="kcal"
            color="#EF4444"
            sub="BMR + Active + NEAT"
          />
        </div>
      </Card>

      {/* Net balance */}
      {(totalBurnt || consumed > 0) && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">Today&apos;s Net Balance</p>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 flex-1 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Consumed</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{consumed > 0 ? consumed.toLocaleString() : '—'}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">kcal</p>
            </div>
            <div className="flex items-center justify-center text-gray-300 dark:text-slate-600 font-black text-xl px-1">−</div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 flex-1 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Burnt</p>
              <p className="text-2xl font-black text-red-500 dark:text-red-400">{totalBurnt ? totalBurnt.toLocaleString() : '—'}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">kcal</p>
            </div>
            <div className="flex items-center justify-center text-gray-300 dark:text-slate-600 font-black text-xl px-1">=</div>
            <div className={`rounded-xl p-4 flex-1 text-center ${netBalance == null ? 'bg-gray-50 dark:bg-slate-800' : netBalance < 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Net</p>
              <p className={`text-2xl font-black ${netBalance == null ? 'text-gray-400' : netBalance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                {netBalance != null ? (netBalance > 0 ? '+' : '') + netBalance.toLocaleString() : '—'}
              </p>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500">
                {netBalance != null ? (netBalance < 0 ? 'deficit' : 'surplus') : 'kcal'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 14-day chart */}
      <BurnChart dates={getPastDates(14)} />

      {/* Adaptive calibration status */}
      <AdaptiveStatus adaptive={adaptive} formulaBMR={formulaBMR} />

      {/* Week comparison */}
      <WeekComparison metrics={weekMetrics} title="Calories Burnt — Week Comparison" />

      {/* Today's activity calorie breakdown */}
      {activities.length > 0 && weightKg && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Activity Breakdown</p>
          <div className="space-y-2">
            {activities.map((a) => {
              const met   = getMET(a.type);
              const hours = parseDurationMinutes(a.duration) / 60;
              const cal   = Math.round(Math.max(0, (met - 1)) * weightKg * hours);
              return (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{a.type}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-2 font-medium">{a.duration}</span>
                  </div>
                  <span className="text-sm font-black text-red-500 dark:text-red-400">{cal} kcal</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
