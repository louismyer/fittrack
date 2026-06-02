import { ALL_UNITS, MEAL_KEYS } from './constants';

const WEIGHT_TO_G = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME_TO_ML = { ml: 1, L: 1000, 'fl oz': 29.5735, cup: 240, tbsp: 15, tsp: 5 };
const SERVING_UNITS = new Set(['serving', 'piece', 'slice', 'container', 'package']);

/** Normalise raw stored value → structured day object with meals + water */
export function normalizeDayData(raw) {
  if (!raw) return { breakfast: [], lunch: [], dinner: [], snacks: [], water: { ml: 0, target: 2000 } };
  if (Array.isArray(raw)) {
    return { breakfast: raw, lunch: [], dinner: [], snacks: [], water: { ml: 0, target: 2000 } };
  }
  return {
    breakfast: raw.breakfast || [],
    lunch: raw.lunch || [],
    dinner: raw.dinner || [],
    snacks: raw.snacks || [],
    water: raw.water || { ml: 0, target: 2000 },
  };
}

/** Extract per-100g nutriments from an Open Food Facts product */
export function getOffPer100g(product) {
  const n = product?.nutriments || {};
  const cal100 = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0);
  return {
    calories: cal100 || 0,
    protein: n.proteins_100g || 0,
    carbs: n.carbohydrates_100g || 0,
    fat: n.fat_100g || 0,
  };
}

/** Parse serving_size string like "30 g", "250 ml", "1 cup" */
export function parseServingSize(servingSize) {
  if (!servingSize || typeof servingSize !== 'string') return null;
  const match = servingSize.trim().match(/^([\d.,]+)\s*(.+)$/i);
  if (!match) return null;
  const qty = parseFloat(match[1].replace(',', '.'));
  let unit = match[2].trim().toLowerCase();
  if (unit === 'servings' || unit === 'portion' || unit === 'portions') unit = 'serving';
  if (unit === 'grams') unit = 'g';
  if (unit === 'milliliters' || unit === 'millilitres') unit = 'ml';
  if (unit === 'liters' || unit === 'litres') unit = 'L';
  if (unit === 'pieces') unit = 'piece';
  if (unit === 'slices') unit = 'slice';
  if (unit === 'containers') unit = 'container';
  if (unit === 'packages') unit = 'package';
  if (!ALL_UNITS.includes(unit)) return null;
  return { quantity: qty, unit };
}

/** Default unit/qty from OFF product */
export function getDefaultQuantity(product) {
  const parsed = parseServingSize(product?.serving_size);
  if (parsed) return parsed;
  const sq = parseFloat(product?.serving_quantity);
  if (sq > 0) return { quantity: sq, unit: 'g' };
  return { quantity: 100, unit: 'g' };
}

/**
 * Convert quantity + unit to grams equivalent.
 * Returns { grams, estimated } where estimated=true when conversion is approximate.
 */
export function toGrams(quantity, unit, product) {
  const q = parseFloat(quantity) || 0;
  if (q <= 0) return { grams: 0, estimated: false };

  if (WEIGHT_TO_G[unit]) {
    return { grams: q * WEIGHT_TO_G[unit], estimated: false };
  }

  const servingQty = parseFloat(product?.serving_quantity) || 0;

  if (VOLUME_TO_ML[unit]) {
    const ml = q * VOLUME_TO_ML[unit];
    if (servingQty > 0) {
      const parsed = parseServingSize(product?.serving_size);
      if (parsed && VOLUME_TO_ML[parsed.unit]) {
        const servingMl = parsed.quantity * VOLUME_TO_ML[parsed.unit];
        return { grams: (ml / servingMl) * servingQty, estimated: true };
      }
    }
    return { grams: ml, estimated: true };
  }

  if (SERVING_UNITS.has(unit)) {
    if (servingQty > 0) {
      return { grams: q * servingQty, estimated: unit !== 'serving' };
    }
    return { grams: q * 100, estimated: true };
  }

  return { grams: q, estimated: true };
}

/** Calculate macros from OFF per-100g values */
export function calcMacros(per100g, quantity, unit, product) {
  const { grams, estimated } = toGrams(quantity, unit, product);
  const r = grams / 100;
  return {
    calories: Math.round((per100g.calories || 0) * r),
    protein: Math.round((per100g.protein || 0) * r * 10) / 10,
    carbs: Math.round((per100g.carbs || 0) * r * 10) / 10,
    fat: Math.round((per100g.fat || 0) * r * 10) / 10,
    estimated,
  };
}

/** Build a normalised OFF product object from API response */
export function normalizeOffProduct(product, code) {
  return {
    code: code || product.code,
    product_name: product.product_name || product.product_name_en || 'Unknown Product',
    brands: product.brands || '',
    nutriments: product.nutriments || {},
    serving_size: product.serving_size || '',
    serving_quantity: product.serving_quantity || '',
  };
}

/** Collect last N unique logged foods across all meals */
export function getRecentFoods(meals, limit = 10) {
  const all = MEAL_KEYS.flatMap(key =>
    (meals[key] || []).map(item => ({ ...item, mealKey: key })),
  );
  all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const seen = new Set();
  const recent = [];
  for (const item of all) {
    const key = `${item.name}|${item.brand || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push(item);
    if (recent.length >= limit) break;
  }
  return recent;
}
