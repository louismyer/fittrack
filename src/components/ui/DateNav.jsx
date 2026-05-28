import { ChevronLeft, ChevronRight } from 'lucide-react';
import { today, formatDisplayDate } from '../../utils/date';

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Compact date navigator. Drop it anywhere alongside an input form.
 * Props: date (YYYY-MM-DD string), onChange (fn)
 */
export default function DateNav({ date, onChange }) {
  const todayStr = today();
  const isToday = date === todayStr;

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={13} strokeWidth={2.5} />
      </button>

      {/* Invisible native date input sits on top of the pill */}
      <div className="relative">
        <input
          type="date"
          value={date}
          max={todayStr}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          aria-label="Select date"
        />
        <span
          className={`block text-xs font-bold px-2 py-1 rounded-md select-none whitespace-nowrap transition-colors ${
            isToday
              ? 'bg-brand/10 text-brand dark:bg-brand/20'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isToday ? 'Today' : formatDisplayDate(date)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={isToday}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRight size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
