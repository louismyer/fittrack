import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { MEAL_LABELS } from './constants';

export default function FoodLogRow({ item, mealKey, onDelete, onEdit }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startOffset.current = offsetX;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX.current;
    setOffsetX(Math.min(0, Math.max(-80, startOffset.current + diff)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    setOffsetX(offsetX < -40 ? -72 : 0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 w-[72px] flex items-center justify-center bg-red-500">
        <button
          type="button"
          onClick={() => onDelete(mealKey, item.id)}
          className="flex items-center gap-1 text-white text-xs font-semibold px-2"
          aria-label="Delete"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <button
        type="button"
        onClick={() => onEdit(mealKey, item)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-left transition-transform duration-150"
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.name}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {item.quantity}{item.unit === 'serving' ? ' serving' : ` ${item.unit}`}
          </p>
        </div>
        <span className="text-sm font-bold text-brand flex-shrink-0">
          {item.calories} kcal
        </span>
      </button>
    </div>
  );
}

export function MealEmptyState({ mealKey, onAdd }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(mealKey)}
      className="w-full py-4 text-center text-xs text-gray-400 dark:text-slate-500 hover:text-brand transition-colors"
    >
      Tap + to log {MEAL_LABELS[mealKey]}
    </button>
  );
}
