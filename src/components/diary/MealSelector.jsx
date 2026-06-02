import { MEAL_KEYS, MEAL_LABELS, getDefaultMeal } from './constants';

export default function MealSelector({ onSelect, onClose }) {
  const defaultMeal = getDefaultMeal();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-md rounded-t-2xl p-5 shadow-card"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[15px] font-semibold text-section-header mb-4">Log to which meal?</p>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_KEYS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`py-3 rounded-lg text-[15px] font-semibold transition-colors ${
                key === defaultMeal
                  ? 'bg-brand text-white'
                  : 'bg-background text-section-header hover:bg-brand/10'
              }`}
            >
              {MEAL_LABELS[key]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-[13px] text-secondary font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
