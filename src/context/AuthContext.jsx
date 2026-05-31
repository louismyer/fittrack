import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession() is the authoritative source for the initial auth state.
    // It resolves with whatever Supabase considers the current valid session,
    // including any token refresh that may be needed.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // onAuthStateChange handles *subsequent* auth events (sign-in, sign-out,
    // token refresh). We skip INITIAL_SESSION because getSession() above
    // already covers that case — listening to both causes a race condition
    // where a stale cached session briefly sets user to a truthy value while
    // getSession() is still in-flight, causing AuthScreen to unmount/remount
    // and resetting any typed input.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
