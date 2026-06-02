import { useState, useRef } from 'react';
import { Droplets } from 'lucide-react';
import Card from '../ui/Card';

const CUP_ML = 250;
const CUP_COUNT = 8;

export default function WaterWidget({ water, onChange }) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(water.target || 2000));
  const longPressRef = useRef(null);

  const target = water.target || 2000;
  const filledCups = Math.min(Math.floor((water.ml || 0) / CUP_ML), CUP_COUNT);
  const pct = Math.min((water.ml || 0) / target, 1);

  const toggleCup = (index) => {
    if (index < filledCups) onChange({ ...water, ml: index * CUP_ML });
    else onChange({ ...water, ml: (index + 1) * CUP_ML });
  };

  const handleLongPressStart = () => {
    longPressRef.current = setTimeout(() => {
      setTempTarget(String(target));
      setEditingTarget(true);
    }, 500);
  };

  const handleLongPressEnd = () => clearTimeout(longPressRef.current);

  const saveTarget = () => {
    const val = parseInt(tempTarget, 10);
    if (val > 0) onChange({ ...water, target: val });
    setEditingTarget(false);
  };

  return (
    <>
      <Card
        className="p-5"
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">
          Water Intake
        </p>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black tracking-tight text-brand">
            {(water.ml || 0).toLocaleString()} ml
          </span>
          <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">
            / {target.toLocaleString()} ml
          </span>
        </div>
        <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-4">
          Long-press to edit target · Each cup = 250 ml
        </p>

        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-2 rounded-full bg-brand transition-all duration-500"
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {Array.from({ length: CUP_COUNT }).map((_, i) => {
            const filled = i < filledCups;
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleCup(i)}
                className="flex-1 flex items-center justify-center py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                aria-label={`Cup ${i + 1}, ${filled ? 'filled' : 'empty'}`}
              >
                <Droplets
                  size={24}
                  className={filled ? 'text-brand fill-brand/20' : 'text-gray-300 dark:text-slate-600'}
                  strokeWidth={filled ? 2 : 1.5}
                />
              </button>
            );
          })}
        </div>
      </Card>

      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingTarget(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-5 shadow-xl border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900 dark:text-white mb-3">Daily Water Target</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="250"
                step="250"
                value={tempTarget}
                onChange={e => setTempTarget(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <span className="self-center text-gray-400 dark:text-slate-500 text-sm">ml</span>
            </div>
            <button
              type="button"
              onClick={saveTarget}
              className="w-full mt-3 py-2.5 rounded-lg bg-brand text-white text-sm font-bold"
            >
              Save Target
            </button>
          </div>
        </div>
      )}
    </>
  );
}
