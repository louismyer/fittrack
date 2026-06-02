import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MEAL_LABELS, INPUT_CLS } from './constants';

export default function QuickAddModal({ mealKey, editItem, onClose, onLog }) {
  const [name, setName] = useState(editItem?.name || '');
  const [calories, setCalories] = useState(editItem ? String(editItem.calories) : '');
  const [protein, setProtein] = useState(editItem ? String(editItem.protein) : '');
  const [carbs, setCarbs] = useState(editItem ? String(editItem.carbs) : '');
  const [fat, setFat] = useState(editItem ? String(editItem.fat) : '');

  const handleLog = () => {
    if (!name.trim()) return;
    onLog(mealKey, {
      id: editItem?.id || Date.now(),
      name: name.trim(),
      brand: null,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      quantity: 1,
      unit: 'serving',
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary">
          <X size={18} />
        </button>
        <h2 className="text-[15px] font-semibold text-section-header">
          {editItem ? 'Edit' : 'Quick Add'} — {MEAL_LABELS[mealKey]}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary mb-1.5">Food Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT_CLS} placeholder="e.g. Homemade smoothie" />
        </div>
        {[
          ['calories', 'Calories (kcal)'],
          ['protein', 'Protein (g)'],
          ['carbs', 'Carbs (g)'],
          ['fat', 'Fat (g)'],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary mb-1.5">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={{ calories, protein, carbs, fat }[key]}
              onChange={e => ({ calories: setCalories, protein: setProtein, carbs: setCarbs, fat: setFat }[key](e.target.value))}
              className={INPUT_CLS}
            />
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-surface-border">
        <button
          type="button"
          onClick={handleLog}
          disabled={!name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[15px] font-semibold text-white bg-brand disabled:opacity-50"
        >
          <Check size={16} />
          {editItem ? 'Update' : 'Log to'} {MEAL_LABELS[mealKey]}
        </button>
      </div>
    </div>
  );
}
