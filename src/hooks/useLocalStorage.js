import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Re-read from storage whenever the key changes (e.g. date navigation).
  // Without this, useState keeps the previous date's value in memory.
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
  return useLocalStorage(key, initialValue);
}

export function useGlobalData(key, initialValue) {
  return useLocalStorage(`ft_global_${key}`, initialValue);
}
