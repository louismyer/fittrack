import { useState, useMemo } from 'react';
import { ArrowLeft, X, Check } from 'lucide-react';
import { MEAL_LABELS, UNIT_GROUPS, INPUT_CLS } from './constants';
import { getOffPer100g, getDefaultQuantity, calcMacros } from './nutrition';
import MacroPreview from './MacroPreview';

export default function FoodDetailModal({ product, mealKey, editItem, onBack, onClose, onLog }) {
  const defaults = useMemo(() => {
    if (editItem) return { quantity: String(editItem.quantity), unit: editItem.unit };
    return getDefaultQuantity(product);
  }, [product, editItem]);

  const [unit, setUnit] = useState(defaults.unit);
  const [quantity, setQuantity] = useState(String(defaults.quantity));

  const per100g = useMemo(() => getOffPer100g(product), [product]);
  const macros = useMemo(() => calcMacros(per100g, quantity, unit, product), [per100g, quantity, unit, product]);

  const name = product.product_name || product.product_name_en || editItem?.name || 'Unknown';

  const handleLog = () => {
    onLog(mealKey, {
      id: editItem?.id || Date.now(),
      name,
      brand: product.brands || editItem?.brand || null,
      ...macros,
      quantity: parseFloat(quantity) || 0,
      unit,
      offProduct: product,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border flex-shrink-0">
        <button
          type="button"
          onClick={onBack || onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:bg-background transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-section-header truncate">{name}</h2>
          {(product.brands || editItem?.brand) && (
            <p className="text-[13px] text-secondary truncate">{product.brands || editItem?.brand}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:bg-background transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {product.serving_size && (
          <div className="bg-background rounded-lg px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Serving Size</p>
            <p className="text-[13px] font-medium text-section-header mt-0.5">{product.serving_size}</p>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary mb-2">
            Quantity
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className={`${INPUT_CLS} w-28 flex-shrink-0`}
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className={`${INPUT_CLS} flex-1 appearance-none`}
            >
              {UNIT_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.units.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {macros.estimated && (
            <p className="text-[13px] text-secondary mt-2 italic">
              Nutrition estimated based on serving size.
            </p>
          )}
        </div>

        <MacroPreview macros={macros} />
      </div>

      <div className="p-4 border-t border-surface-border flex-shrink-0">
        <button
          type="button"
          onClick={handleLog}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[15px] font-semibold text-white bg-brand hover:bg-brand/90 active:scale-[0.98] transition-all"
        >
          <Check size={16} strokeWidth={2.5} />
          {editItem ? 'Update' : 'Log to'} {MEAL_LABELS[mealKey]}
        </button>
      </div>
    </div>
  );
}
