import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const REMEMBER_ME_KEY = 'ft_remember_me';

/** Whether the user chose to stay signed in across browser restarts. Defaults to true. */
export function getRememberMe() {
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
}

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
}

const authStorage = {
  getItem(key) {
    const store = getRememberMe() ? localStorage : sessionStorage;
    return store.getItem(key);
  },
  setItem(key, value) {
    const store = getRememberMe() ? localStorage : sessionStorage;
    store.setItem(key, value);
  },
  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});
