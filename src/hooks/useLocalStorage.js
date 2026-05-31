import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Maps section name → Supabase table
const TABLE_MAP = {
  steps:  'steps_log',
  sleep:  'sleep_log',
  food:   'food_log',
  water:  'water_log',
  weight: 'weight_log',
};

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch {
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export function useDayData(section, date, initialValue) {
  const key = `ft_${section}_${date}`;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Re-read from localStorage when key changes (date navigation)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch {
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Fetch latest from Supabase on mount / date change
  useEffect(() => {
    const table = TABLE_MAP[section];
    if (!table) return;
    getUserId().then((userId) => {
      if (!userId) return;
      supabase
        .from(table)
        .select('data')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle()
        .then(({ data: row }) => {
          if (row?.data != null) {
            localStorage.setItem(key, JSON.stringify(row.data));
            setStoredValue(row.data);
          }
        });
    });
  }, [key, section, date]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Async persist to Supabase
      const table = TABLE_MAP[section];
      if (table) {
        getUserId().then((userId) => {
          if (!userId) return;
          supabase.from(table).upsert(
            { user_id: userId, date, data: valueToStore, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,date' }
          );
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export function useGlobalData(key, initialValue) {
  const lsKey = `ft_global_${key}`;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(lsKey);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Fetch from Supabase on mount
  useEffect(() => {
    getUserId().then((userId) => {
      if (!userId) return;
      supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle()
        .then(({ data: row }) => {
          if (row?.value != null) {
            localStorage.setItem(lsKey, JSON.stringify(row.value));
            setStoredValue(row.value);
          }
        });
    });
  }, [key, lsKey]);

  const setValue = (value) => {
    try {
      const v = value instanceof Function ? value(storedValue) : value;
      setStoredValue(v);
      localStorage.setItem(lsKey, JSON.stringify(v));

      getUserId().then((userId) => {
        if (!userId) return;
        supabase.from('user_settings').upsert(
          { user_id: userId, key, value: v },
          { onConflict: 'user_id,key' }
        );
      });
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
