import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

const ACTIONS = [
  { id: 'search', label: 'Search', emoji: '🔍' },
  { id: 'scan', label: 'Scan Barcode', emoji: '📷' },
  { id: 'quick-add', label: 'Quick Add', emoji: '✏️' },
  { id: 'recent', label: 'Recent Foods', emoji: '🍽️' },
];

export default function LogFab({ onAction }) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  const handleAction = (id) => {
    setOpen(false);
    onAction(id);
  };

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 sm:bottom-8 sm:right-10 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {ACTIONS.map(({ id, label, emoji }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(id)}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg px-4 py-3 min-w-[180px] animate-fab-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-lg bg-brand text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label={open ? 'Close menu' : 'Log food'}
      >
        {open ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
