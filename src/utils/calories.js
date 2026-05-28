import { getPastDates } from './date';

// ─── Water Target Calculation ─────────────────────────────────────────────────

const INTENSE  = /run|jog|hiit|sprint|interval|football|soccer|basketball|rugby|box|crossfit/i;
const LIGHT    = /walk|yoga|golf|stretch|pilates|tai.?chi/i;
// everything else → moderate (500 ml/30 min)

/**
 * Classify an activity type string into 'light' | 'moderate' | 'intense'.
 */
export function classifyActivityIntensity(type) {
  if (INTENSE.test(type)) return 'intense';
  if (LIGHT.test(type))   return 'light';
  return 'moderate';
}

/**
 * Calculate recommended daily water intake in ml.
 *
 *  Base             : weight_kg × 35 ml
 *  Height bonus     : +100 ml per 10 cm over 170 cm
 *  Exercise bonus   : per 30 min of activity
 *    light          : +250 ml
 *    moderate       : +500 ml
 *    intense        : +750 ml
 *  Rounded to nearest 100 ml.
 *
 * Returns null when weight is unknown.
 */
export function calcWaterTargetMl(weightKg, heightCm, activities = []) {
  if (!weightKg) return null;

  let ml = weightKg * 35;

  if (heightCm && heightCm > 170) {
    ml += Math.floor((heightCm - 170) / 10) * 100;
  }

  for (const a of activities) {
    const mins = parseDurationMinutes(a.duration);
    const intensity = classifyActivityIntensity(a.type);
    const mlPer30 = intensity === 'intense' ? 750 : intensity === 'light' ? 250 : 500;
    ml += (mins / 30) * mlPer30;
  }

  return Math.round(ml / 100) * 100;
}

/**
 * Build the breakdown lines for the water target tooltip / detail card.
 */
export function waterTargetBreakdown(weightKg, heightCm, activities = []) {
  if (!weightKg) return [];
  const lines = [];
  lines.push({ label: `Base (${weightKg} kg × 35 ml)`, ml: Math.round(weightKg * 35) });

  if (heightCm && heightCm > 170) {
    const bonus = Math.floor((heightCm - 170) / 10) * 100;
    if (bonus > 0) lines.push({ label: `Height bonus (${heightCm} cm)`, ml: bonus });
  }

  for (const a of activities) {
    const mins = parseDurationMinutes(a.duration);
    const intensity = classifyActivityIntensity(a.type);
    const mlPer30 = intensity === 'intense' ? 750 : intensity === 'light' ? 250 : 500;
    const bonus = Math.round((mins / 30) * mlPer30);
    lines.push({ label: `${a.type} (${a.duration} · ${intensity})`, ml: bonus });
  }

  return lines;
}

// ─── BMR Formula ─────────────────────────────────────────────────────────────

/** Mifflin-St Jeor BMR (kcal/day). Returns null if inputs missing. */
export function mifflinBMR(weightKg, heightCm, age, sex) {
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

// ─── MET-based Active Calories ────────────────────────────────────────────────

const MET_MAP = [
  [/run|jog/,                          9.8],
  [/sprint|interval|hiit/,            11.0],
  [/cycl|bike|bik/,                    7.5],
  [/swim/,                             7.0],
  [/row/,                              7.0],
  [/skip|jump rope/,                   9.0],
  [/football|soccer|basketball/,       8.0],
  [/tennis|squash|badminton/,          7.0],
  [/yoga|stretch|pilates/,             2.5],
  [/walk/,                             3.5],
  [/hike/,                             5.5],
  [/weight|strength|lift|gym/,         5.0],
  [/dance|zumba/,                      5.5],
  [/elliptic|cross.train/,             6.0],
  [/climb|bouldering/,                 8.0],
];

export function getMET(activityType) {
  const t = activityType.toLowerCase();
  for (const [pattern, met] of MET_MAP) {
    if (pattern.test(t)) return met;
  }
  return 4.5; // moderate default
}

export function parseDurationMinutes(str) {
  if (!str) return 30;
  const m = str.match(/(\d+(?:\.\d+)?)\s*(h(?:r|our)?|m(?:in)?|s(?:ec)?)?/i);
  if (!m) return 30;
  const val = parseFloat(m[1]);
  const unit = (m[2] || '').toLowerCase();
  if (unit.startsWith('h')) return val * 60;
  if (unit.startsWith('s')) return val / 60;
  return val;
}

/**
 * Net active calories from logged activities (above resting baseline).
 * Uses (MET - 1) × weight × hours so it doesn't double-count BMR.
 */
export function calcActiveCalories(activities, weightKg) {
  if (!activities?.length || !weightKg) return 0;
  return Math.round(
    activities.reduce((total, a) => {
      const met = getMET(a.type);
      const hours = parseDurationMinutes(a.duration) / 60;
      return total + Math.max(0, (met - 1)) * weightKg * hours;
    }, 0)
  );
}

/**
 * Calories burnt from step count using stride-distance method.
 *
 *   stride_length (m) = height_cm × 0.415 / 100
 *   distance (km)     = steps × stride_length / 1000
 *   calories          = distance_km × weight_kg × 0.57
 *
 * heightCm is required for an accurate result. If absent the function
 * returns 0 rather than silently defaulting to a population average,
 * so the UI can prompt the user to fill in their profile.
 */
export function calcNEATCalories(steps, weightKg, heightCm) {
  if (!steps || !weightKg || !heightCm) return 0;
  const strideLengthM = (heightCm * 0.415) / 100;      // metres per step
  const distanceKm    = (steps * strideLengthM) / 1000;
  return Math.round(distanceKm * weightKg * 0.57);
}

// ─── Adaptive TDEE from Historical Data ──────────────────────────────────────

/**
 * Reads last `days` days of weight + food data from localStorage.
 * Returns { weightHistory, caloriesHistory }.
 */
export function buildHistory(days = 30) {
  const weightHistory = [];
  const caloriesHistory = [];
  const dates = getPastDates(days);

  for (const dateStr of dates) {
    try {
      const w = localStorage.getItem(`ft_weight_${dateStr}`);
      const wd = w ? JSON.parse(w) : null;
      if (wd?.weight) weightHistory.push({ date: dateStr, weight: wd.weight });

      const f = localStorage.getItem(`ft_food_${dateStr}`);
      const fd = f ? JSON.parse(f) : null;
      if (Array.isArray(fd)) {
        const cal = fd.reduce((a, m) => a + (m.calories || 0), 0);
        if (cal > 0) caloriesHistory.push({ date: dateStr, calories: cal });
      }
    } catch { /* ignore parse errors */ }
  }

  return { weightHistory, caloriesHistory };
}

/**
 * Derives an estimated TDEE from actual weight-trend + calorie data.
 * Requires ≥ 7 paired days. Returns null if insufficient data.
 *
 * Equation: TDEE = avg_calories_consumed - (Δweight_per_day × 7_700)
 *   • Weight loss  → negative Δweight → TDEE > avg calories
 *   • Weight gain  → positive Δweight → TDEE < avg calories
 */
export function getAdaptiveTDEE(weightHistory, caloriesHistory) {
  const MIN_CAL_DAYS   = 7;
  const MIN_WEIGHT_PTS = 2;

  if (
    caloriesHistory.length < MIN_CAL_DAYS ||
    weightHistory.length   < MIN_WEIGHT_PTS
  ) return null;

  const sorted = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
  const first  = sorted[0];
  const last   = sorted[sorted.length - 1];
  const daysDiff = (new Date(last.date) - new Date(first.date)) / 86_400_000;

  if (daysDiff < 6) return null;

  const avgCalories = caloriesHistory.reduce((s, d) => s + d.calories, 0) / caloriesHistory.length;
  const deltaWeightKg = last.weight - first.weight;
  const deltaCalPerDay = (deltaWeightKg / daysDiff) * 7_700;
  const tdee = Math.round(avgCalories - deltaCalPerDay);

  const confidence = Math.min(caloriesHistory.length / 14, 1.0);

  return { tdee, confidence, dataPoints: caloriesHistory.length, daysDiff: Math.round(daysDiff) };
}

/**
 * Returns the best available BMR estimate:
 *   - If adaptive data is available with confidence ≥ 0.5 → blended estimate
 *   - Otherwise → formula BMR only
 */
export function getBestBMR(formulaBMR, adaptive) {
  if (!formulaBMR) return null;
  if (!adaptive || adaptive.confidence < 0.3) return { value: formulaBMR, source: 'formula', confidence: 0 };

  // Adaptive TDEE ≈ TDEE; subtract active + NEAT to back into BMR is complex.
  // Instead, blend the TDEE as a reference point and display alongside formula.
  const blend = Math.round(formulaBMR * (1 - adaptive.confidence) + adaptive.tdee * adaptive.confidence);
  return { value: blend, tdee: adaptive.tdee, source: 'adaptive', confidence: adaptive.confidence };
}
