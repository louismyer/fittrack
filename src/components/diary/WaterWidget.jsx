import { useState, useRef } from 'react';
import { Droplets } from 'lucide-react';

const CUP_ML = 250;
const CUP_COUNT = 8;

export default function WaterWidget({ water, onChange }) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(water.target || 2000));
  const longPressRef = useRef(null);

  const target = water.target || 2000;
  const filledCups = Math.min(Math.floor((water.ml || 0) / CUP_ML), CUP_COUNT);

  const toggleCup = (index) => {
    const currentFilled = filledCups;
    if (index < currentFilled) {
      onChange({ ...water, ml: index * CUP_ML });
    } else {
      onChange({ ...water, ml: (index + 1) * CUP_ML });
    }
  };

  const handleLongPressStart = () => {
    longPressRef.current = setTimeout(() => {
      setTempTarget(String(target));
      setEditingTarget(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressRef.current);
  };

  const saveTarget = () => {
    const val = parseInt(tempTarget, 10);
    if (val > 0) onChange({ ...water, target: val });
    setEditingTarget(false);
  };

  return (
    <div
      className="bg-surface rounded-lg shadow-card px-4 py-3"
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-medium text-secondary">Water</span>
        <span className="text-[13px] font-semibold text-brand">
          {(water.ml || 0).toLocaleString()} ml / {target.toLocaleString()} ml
        </span>
      </div>

      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: CUP_COUNT }).map((_, i) => {
          const filled = i < filledCups;
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleCup(i)}
              className="flex-1 flex items-center justify-center py-1 transition-transform active:scale-95"
              aria-label={`Cup ${i + 1}, ${filled ? 'filled' : 'empty'}`}
            >
              <Droplets
                size={22}
                className={filled ? 'text-brand fill-brand/20' : 'text-progress-track'}
                strokeWidth={filled ? 2 : 1.5}
              />
            </button>
          );
        })}
      </div>

      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditingTarget(false)}>
          <div className="bg-surface w-full max-w-md rounded-t-2xl p-5 shadow-card" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] font-semibold text-section-header mb-3">Daily Water Target</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="250"
                step="250"
                value={tempTarget}
                onChange={e => setTempTarget(e.target.value)}
                className="flex-1 border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <span className="self-center text-secondary text-sm">ml</span>
            </div>
            <button
              type="button"
              onClick={saveTarget}
              className="w-full mt-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold"
            >
              Save Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
