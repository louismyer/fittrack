import { Plus } from 'lucide-react';
import { MEAL_LABELS } from './constants';
import FoodLogRow, { MealEmptyState } from './FoodLogRow';

export default function MealSection({ mealKey, items, onAddFood, onRemoveFood, onEditFood }) {
  const subtotal = items.reduce((acc, item) => acc + (item.calories || 0), 0);

  return (
    <div className="bg-surface rounded-lg shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <span className="text-[15px] font-semibold text-section-header">{MEAL_LABELS[mealKey]}</span>
        <div className="flex items-center gap-3">
          {subtotal > 0 && (
            <span className="text-[13px] font-semibold text-brand">{subtotal} kcal</span>
          )}
          <button
            type="button"
            onClick={() => onAddFood(mealKey)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-brand hover:bg-brand/10 transition-colors"
            aria-label={`Add food to ${MEAL_LABELS[mealKey]}`}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="px-2 py-2 space-y-1">
        {items.length === 0 ? (
          <MealEmptyState mealKey={mealKey} onAdd={onAddFood} />
        ) : (
          items.map(item => (
            <FoodLogRow
              key={item.id}
              item={item}
              mealKey={mealKey}
              onDelete={onRemoveFood}
              onEdit={onEditFood}
            />
          ))
        )}
      </div>
    </div>
  );
}
