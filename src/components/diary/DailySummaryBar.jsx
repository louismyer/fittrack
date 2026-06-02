export default function DailySummaryBar({ totals, targets }) {
  const calPct = Math.min((totals.calories / (targets.calories || 1)) * 100, 100);

  return (
    <div className="sticky top-[7.5rem] z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-surface-border shadow-card">
      {/* Calorie bar */}
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[13px] font-medium text-secondary">Calories</span>
          <span className="text-[13px] font-semibold text-brand">
            {totals.calories.toLocaleString()} / {targets.calories.toLocaleString()} kcal
          </span>
        </div>
        <div className="w-full bg-progress-track rounded-lg h-2 overflow-hidden">
          <div
            className="h-2 rounded-lg bg-brand transition-all duration-300"
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>

      {/* Macro row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', value: Math.round(totals.protein), target: targets.protein },
          { label: 'Carbs', value: Math.round(totals.carbs), target: targets.carbs },
          { label: 'Fat', value: Math.round(totals.fat), target: targets.fat },
        ].map(({ label, value, target }) => {
          const pct = Math.min((value / (target || 1)) * 100, 100);
          return (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium text-secondary">{label}</span>
                <span className="text-[11px] font-semibold text-brand">{value}g</span>
              </div>
              <div className="w-full bg-progress-track rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-secondary mt-0.5">/ {target}g</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
