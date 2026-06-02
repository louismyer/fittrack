import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRememberMe } from '../lib/supabase';

const INPUT = 'w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeChecked] = useState(getRememberMe);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password, rememberMe);
        if (err) setError(err.message);
      } else {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err.message);
        } else {
          setMessage('Account created! Check your email to confirm, then log in.');
          setMode('login');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl mb-4 shadow-md">
            <Activity size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">FitTrack</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Your personal fitness dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 text-green-700 dark:text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={INPUT}
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={INPUT}
              />
            </div>

            {mode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMeChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-brand focus:ring-brand/40"
                />
                <span className="text-sm text-gray-600 dark:text-slate-400">Remember me</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-brand hover:underline font-semibold"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
