import { MEAL_KEYS, MEAL_LABELS, getDefaultMeal } from './constants';

export default function MealSelector({ onSelect, onClose }) {
  const defaultMeal = getDefaultMeal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-5 shadow-xl border border-gray-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-gray-900 dark:text-white mb-4">Log to which meal?</p>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_KEYS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                key === defaultMeal
                  ? 'bg-brand text-white'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-brand/10'
              }`}
            >
              {MEAL_LABELS[key]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-sm text-gray-400 dark:text-slate-500 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
