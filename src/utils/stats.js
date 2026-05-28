import { shortDate, calcHoursSlept } from './date';

/** Read water intake for a day in ml, regardless of old glasses format. */
export function getWaterMl(data) {
  if (!data) return 0;
  if (data.ml != null) return data.ml;
  if (data.glasses != null) return Math.round(data.glasses * 250);
  return 0;
}

export function getThisWeekDates() {
  return getPastN(7, 0);
}

export function getLastWeekDates() {
  return getPastN(7, 7);
}

function getPastN(n, offsetDaysAgo) {
  const dates = [];
  for (let i = offsetDaysAgo + n - 1; i >= offsetDaysAgo; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function readDay(section, date) {
  try {
    const raw = localStorage.getItem(`ft_${section}_${date}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readGlobal(key, fallback) {
  try {
    const raw = localStorage.getItem(`ft_global_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Returns [{label, value}] for a given section and date range.
// value is null when no data exists for that day.
export function getSeriesData(section, dates) {
  return dates.map((d) => {
    const label = shortDate(d);
    const data = readDay(section, d);

    switch (section) {
      case 'steps':
        return { label, value: data?.steps || 0 };
      case 'sleep': {
        const hours = data ? parseFloat(calcHoursSlept(data.bedtime, data.waketime)) || 0 : 0;
        return { label, value: hours };
      }
      case 'food': {
        const meals = Array.isArray(data) ? data : [];
        const cals = meals.reduce((a, m) => a + (m.calories || 0), 0);
        return { label, value: cals };
      }
      case 'water':
        return { label, value: getWaterMl(data) };
      case 'weight':
        return { label, value: data?.weight ?? null };
      default:
        return { label, value: null };
    }
  });
}

// Returns { this: {...}, last: {...} } with section-specific metrics.
export function calcWeekComparison(section, thisDates, lastDates) {
  switch (section) {
    case 'steps': {
      const thisVals = thisDates.map((d) => readDay('steps', d)?.steps || 0);
      const lastVals = lastDates.map((d) => readDay('steps', d)?.steps || 0);
      return {
        this: { avg: avg(thisVals), total: sum(thisVals) },
        last: { avg: avg(lastVals), total: sum(lastVals) },
        metrics: [
          { label: 'Avg Steps / Day', thisVal: Math.round(avg(thisVals)), lastVal: Math.round(avg(lastVals)), unit: 'steps', higherIsBetter: true },
          { label: 'Total Steps', thisVal: sum(thisVals), lastVal: sum(lastVals), unit: 'steps', higherIsBetter: true },
        ],
      };
    }
    case 'sleep': {
      const thisHours = thisDates.map((d) => {
        const e = readDay('sleep', d);
        return e ? parseFloat(calcHoursSlept(e.bedtime, e.waketime)) || null : null;
      });
      const lastHours = lastDates.map((d) => {
        const e = readDay('sleep', d);
        return e ? parseFloat(calcHoursSlept(e.bedtime, e.waketime)) || null : null;
      });
      const thisQuality = thisDates.map((d) => readDay('sleep', d)?.quality || null);
      const lastQuality = lastDates.map((d) => readDay('sleep', d)?.quality || null);
      return {
        metrics: [
          { label: 'Avg Hours / Night', thisVal: avgNonNull(thisHours), lastVal: avgNonNull(lastHours), unit: 'hrs', higherIsBetter: true, decimals: 1 },
          { label: 'Avg Quality', thisVal: avgNonNull(thisQuality), lastVal: avgNonNull(lastQuality), unit: '/ 5', higherIsBetter: true, decimals: 1 },
        ],
      };
    }
    case 'food': {
      const thisCals = thisDates.map((d) => {
        const meals = readDay('food', d);
        return Array.isArray(meals) ? meals.reduce((a, m) => a + (m.calories || 0), 0) : 0;
      });
      const lastCals = lastDates.map((d) => {
        const meals = readDay('food', d);
        return Array.isArray(meals) ? meals.reduce((a, m) => a + (m.calories || 0), 0) : 0;
      });
      const thisProt = thisDates.map((d) => {
        const meals = readDay('food', d);
        return Array.isArray(meals) ? meals.reduce((a, m) => a + (m.protein || 0), 0) : 0;
      });
      const lastProt = lastDates.map((d) => {
        const meals = readDay('food', d);
        return Array.isArray(meals) ? meals.reduce((a, m) => a + (m.protein || 0), 0) : 0;
      });
      return {
        metrics: [
          { label: 'Avg Calories / Day', thisVal: Math.round(avg(thisCals)), lastVal: Math.round(avg(lastCals)), unit: 'kcal', higherIsBetter: false },
          { label: 'Avg Protein / Day', thisVal: Math.round(avg(thisProt)), lastVal: Math.round(avg(lastProt)), unit: 'g', higherIsBetter: true },
        ],
      };
    }
    case 'water': {
      const thisMl  = thisDates.map((d) => getWaterMl(readDay('water', d)));
      const lastMl  = lastDates.map((d) => getWaterMl(readDay('water', d)));
      // Days where intake met the stored target (0 means no target saved → skip)
      const thisMet = thisDates.filter((d) => {
        const w = readDay('water', d);
        if (!w) return false;
        const intake = getWaterMl(w);
        const target = w.target || 0;
        return target > 0 && intake >= target;
      }).length;
      const lastMet = lastDates.filter((d) => {
        const w = readDay('water', d);
        if (!w) return false;
        const intake = getWaterMl(w);
        const target = w.target || 0;
        return target > 0 && intake >= target;
      }).length;
      return {
        metrics: [
          { label: 'Avg Intake / Day', thisVal: Math.round(avg(thisMl)), lastVal: Math.round(avg(lastMl)), unit: 'ml', higherIsBetter: true },
          { label: 'Days Goal Met', thisVal: thisMet, lastVal: lastMet, unit: `/ ${thisDates.length}`, higherIsBetter: true },
        ],
      };
    }
    case 'weight': {
      const thisWeightDates = [...thisDates].reverse();
      const lastWeightDates = [...lastDates].reverse();
      const latestThis = thisWeightDates.map((d) => readDay('weight', d)?.weight).find((v) => v != null) ?? null;
      const latestLast = lastWeightDates.map((d) => readDay('weight', d)?.weight).find((v) => v != null) ?? null;
      const unit = readGlobal('weightUnit', 'kg');
      const convert = (v) => (v == null ? null : unit === 'lbs' ? parseFloat((v * 2.20462).toFixed(1)) : v);
      return {
        metrics: [
          { label: 'This Week', thisVal: convert(latestThis), lastVal: convert(latestLast), unit, higherIsBetter: false, decimals: 1, isWeight: true },
        ],
      };
    }
    default:
      return { metrics: [] };
  }
}

// Helpers
function sum(arr) { return arr.reduce((a, b) => a + (b || 0), 0); }
function avg(arr) { return arr.length ? sum(arr) / arr.length : 0; }
function avgNonNull(arr) {
  const valid = arr.filter((v) => v != null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}
