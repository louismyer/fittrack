import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPastDates } from '../utils/date';

const TABLES = [
  { table: 'steps_log',  section: 'steps'  },
  { table: 'sleep_log',  section: 'sleep'  },
  { table: 'food_log',   section: 'food'   },
  { table: 'water_log',  section: 'water'  },
  { table: 'weight_log', section: 'weight' },
];

/**
 * Render-nothing component: on login, fetches the last 30 days of data from
 * Supabase and writes it into localStorage so that sync readDay() calls work
 * immediately throughout the app.
 */
export default function DataSync({ userId }) {
  useEffect(() => {
    if (!userId) return;
    const dates = getPastDates(30);

    const sync = async () => {
      // Sync day logs
      await Promise.all(
        TABLES.map(async ({ table, section }) => {
          const { data } = await supabase
            .from(table)
            .select('date, data')
            .eq('user_id', userId)
            .in('date', dates);
          (data || []).forEach((row) => {
            localStorage.setItem(`ft_${section}_${row.date}`, JSON.stringify(row.data));
          });
        })
      );

      // Sync global settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('key, value')
        .eq('user_id', userId);
      (settings || []).forEach((row) => {
        localStorage.setItem(`ft_global_${row.key}`, JSON.stringify(row.value));
      });
    };

    sync().catch(console.error);
  }, [userId]);

  return null;
}
