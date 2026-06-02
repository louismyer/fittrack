import { X } from 'lucide-react';
import { MEAL_LABELS } from './constants';

export default function RecentFoodsModal({ mealKey, recentFoods, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary">
          <X size={18} />
        </button>
        <h2 className="text-[15px] font-semibold text-section-header">Recent Foods — {MEAL_LABELS[mealKey]}</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {recentFoods.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-secondary">No recent foods yet. Log something first!</p>
          </div>
        ) : (
          recentFoods.map(item => (
            <button
              key={`${item.name}-${item.timestamp}`}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-surface-border hover:bg-background text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-section-header truncate">{item.name}</p>
                <p className="text-[13px] text-secondary mt-0.5">
                  {item.quantity}{item.unit === 'serving' ? ' serving' : ` ${item.unit}`} · {item.calories} kcal
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
