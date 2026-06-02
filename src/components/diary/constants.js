export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snack',
};
export const DEFAULT_MEALS = { breakfast: [], lunch: [], dinner: [], snacks: [] };
export const DEFAULT_WATER = { ml: 0, target: 2000 };
export const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

export const UNIT_GROUPS = [
  {
    label: 'Weight',
    units: [
      { value: 'g', label: 'g' },
      { value: 'kg', label: 'kg' },
      { value: 'oz', label: 'oz' },
      { value: 'lb', label: 'lb' },
    ],
  },
  {
    label: 'Volume',
    units: [
      { value: 'ml', label: 'ml' },
      { value: 'L', label: 'L' },
      { value: 'fl oz', label: 'fl oz' },
      { value: 'cup', label: 'cup' },
      { value: 'tbsp', label: 'tbsp' },
      { value: 'tsp', label: 'tsp' },
    ],
  },
  {
    label: 'Serving',
    units: [
      { value: 'serving', label: 'serving' },
      { value: 'piece', label: 'piece' },
      { value: 'slice', label: 'slice' },
      { value: 'container', label: 'container' },
      { value: 'package', label: 'package' },
    ],
  },
];

export const ALL_UNITS = UNIT_GROUPS.flatMap(g => g.units.map(u => u.value));

/** Default meal based on time of day */
export function getDefaultMeal() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins >= 300 && mins < 630) return 'breakfast';
  if (mins >= 630 && mins < 900) return 'lunch';
  if (mins >= 900 && mins < 1080) return 'snacks';
  if (mins >= 1080 && mins < 1320) return 'dinner';
  return 'snacks';
}

export const INPUT_CLS =
  'w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 dark:placeholder-slate-500';
