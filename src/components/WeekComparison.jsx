import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './ui/Card';

function pctChange(thisVal, lastVal) {
  if (lastVal == null || lastVal === 0 || thisVal == null) return null;
  return ((thisVal - lastVal) / Math.abs(lastVal)) * 100;
}

function fmt(val, decimals = 0) {
  if (val == null) return '—';
  return typeof val === 'number'
    ? val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : val;
}

function ChangeBadge({ pct, higherIsBetter, isWeight }) {
  if (pct == null) return null;
  const positive = pct > 0;
  const isGood = isWeight ? null : positive === higherIsBetter;
  const colorClass = isWeight
    ? 'text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800'
    : isGood
      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      : 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  const Icon = Math.abs(pct) < 0.05 ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
      <Icon size={11} strokeWidth={2.5} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function WeekComparison({ metrics, title = 'Week Comparison' }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-5">{title}</p>
      <div className="space-y-5">
        {metrics.map((m) => {
          const pct = pctChange(m.thisVal, m.lastVal);
          const decimals = m.decimals ?? 0;
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">{m.label}</span>
                <ChangeBadge pct={pct} higherIsBetter={m.higherIsBetter} isWeight={m.isWeight} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">This Week</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    {fmt(m.thisVal, decimals)}
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 ml-1.5">{m.unit}</span>
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Last Week</p>
                  <p className="text-2xl font-black text-gray-400 dark:text-slate-500 tracking-tight leading-none">
                    {fmt(m.lastVal, decimals)}
                    <span className="text-xs font-bold text-gray-300 dark:text-slate-600 ml-1.5">{m.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
