import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSupabaseDayData(table, date, defaultValue) {
  const { user } = useAuth();
  const [data, setLocalData] = useState(defaultValue);
  const dataRef = useRef(defaultValue);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from(table)
      .select('data')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row?.data !== undefined && row?.data !== null) {
          setLocalData(row.data);
          dataRef.current = row.data;
        }
      });
  }, [user?.id, table, date]);

  const setData = useCallback(
    async (value) => {
      const newValue = value instanceof Function ? value(dataRef.current) : value;
      setLocalData(newValue);
      dataRef.current = newValue;
      if (!user) return;
      await supabase.from(table).upsert(
        { user_id: user.id, date, data: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );
    },
    [user?.id, table, date]
  );

  return [data, setData];
}

export function useSupabaseGlobalData(key, defaultValue) {
  const { user } = useAuth();
  const [value, setLocalValue] = useState(defaultValue);
  const valueRef = useRef(defaultValue);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', key)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row?.value !== undefined && row?.value !== null) {
          setLocalValue(row.value);
          valueRef.current = row.value;
        }
      });
  }, [user?.id, key]);

  const setValue = useCallback(
    async (newValue) => {
      const v = newValue instanceof Function ? newValue(valueRef.current) : newValue;
      setLocalValue(v);
      valueRef.current = v;
      if (!user) return;
      await supabase.from('user_settings').upsert(
        { user_id: user.id, key, value: v },
        { onConflict: 'user_id,key' }
      );
    },
    [user?.id, key]
  );

  return [value, setValue];
}

export async function fetchDayRange(table, userId, dates) {
  const { data } = await supabase
    .from(table)
    .select('date, data')
    .eq('user_id', userId)
    .in('date', dates);
  const map = {};
  (data || []).forEach((row) => { map[row.date] = row.data; });
  return map;
}
