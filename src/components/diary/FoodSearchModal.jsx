import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ScanLine } from 'lucide-react';
import { MEAL_LABELS, INPUT_CLS } from './constants';
import { getOffPer100g } from './nutrition';

export default function FoodSearchModal({ mealKey, onClose, onSelectFood, onScanBarcode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const url =
        `https://world.openfoodfacts.org/api/v2/search` +
        `?search_terms=${encodeURIComponent(q)}` +
        `&page_size=20` +
        `&fields=code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResults(json.products || []);
    } catch {
      setError('Search failed — check your connection and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Add to {MEAL_LABELS[mealKey]}
        </h2>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search foods…"
              className={`${INPUT_CLS} pl-9`}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {onScanBarcode && (
            <button
              type="button"
              onClick={onScanBarcode}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-brand hover:text-brand transition-colors"
              aria-label="Scan barcode"
            >
              <ScanLine size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-brand" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Searching…</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && query && results.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && !error && !query && (
          <div className="px-4 py-10 text-center">
            <Search size={32} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Search the Open Food Facts database</p>
          </div>
        )}

        {!loading && results.map(product => {
          const per100 = getOffPer100g(product);
          const name = product.product_name || product.product_name_en || 'Unknown';
          return (
            <button
              key={product.code}
              type="button"
              onClick={() => onSelectFood(product)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">{name}</p>
                {product.brands && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{product.brands}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Per 100g</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-black text-brand">{Math.round(per100.calories)}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">kcal</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
