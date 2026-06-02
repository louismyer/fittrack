import Card from '../ui/Card';

function MacroBar({ label, value, target }) {
  const pct = Math.min((value / (target || 1)) * 100, 100);
  const over = value > target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        <span className={over ? 'text-red-500 font-bold' : 'font-semibold text-gray-600 dark:text-slate-300'}>
          {value}{label === 'Calories' ? ' kcal' : 'g'} / {target}{label === 'Calories' ? ' kcal' : 'g'}
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${over ? 'bg-red-400' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DailySummaryBar({ totals, targets, headerActions }) {
  const calPct = Math.min((totals.calories / (targets.calories || 1)) * 100, 100);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          Daily Summary
        </p>
        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-5xl font-black tracking-tight text-brand">
          {totals.calories.toLocaleString()}
        </span>
        <span className="text-base font-semibold text-gray-400 dark:text-slate-500">
          / {targets.calories.toLocaleString()} kcal
        </span>
      </div>
      <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-4">
        {Math.round(calPct)}% of daily calorie goal
      </p>

      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 mb-5 overflow-hidden">
        <div
          className="h-3 rounded-full bg-brand transition-all duration-500"
          style={{ width: `${calPct}%` }}
        />
      </div>

      <div className="space-y-3.5">
        <MacroBar label="Protein" value={Math.round(totals.protein)} target={targets.protein} />
        <MacroBar label="Carbs" value={Math.round(totals.carbs)} target={targets.carbs} />
        <MacroBar label="Fat" value={Math.round(totals.fat)} target={targets.fat} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Protein', value: Math.round(totals.protein) },
          { label: 'Carbs', value: Math.round(totals.carbs) },
          { label: 'Fat', value: Math.round(totals.fat) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-xl font-black text-brand">{value}</p>
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500">g</p>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
