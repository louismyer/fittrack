import { X } from 'lucide-react';
import { MEAL_LABELS } from './constants';

export default function RecentFoodsModal({ mealKey, recentFoods, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500">
          <X size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Foods — {MEAL_LABELS[mealKey]}</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {recentFoods.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">No recent foods yet. Log something first!</p>
          </div>
        ) : (
          recentFoods.map(item => (
            <button
              key={`${item.name}-${item.timestamp}`}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
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
