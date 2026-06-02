import { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, ScanLine, Pencil, Clock } from 'lucide-react';

const ACTIONS = [
  { id: 'search', label: 'Search', Icon: Search, emoji: '🔍' },
  { id: 'scan', label: 'Scan Barcode', Icon: ScanLine, emoji: '📷' },
  { id: 'quick-add', label: 'Quick Add', Icon: Pencil, emoji: '✏️' },
  { id: 'recent', label: 'Recent Foods', Icon: Clock, emoji: '🍽️' },
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
    <div ref={fabRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
      {open && (
        <div className="flex flex-col items-center gap-2 mb-1">
          {ACTIONS.map(({ id, label, emoji }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(id)}
              className="flex items-center gap-3 bg-surface rounded-lg shadow-lg px-4 py-3 min-w-[200px] animate-fab-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[15px] font-semibold text-section-header">{label}</span>
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
